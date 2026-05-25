import argparse
import re
import sqlite3
from pathlib import Path

import pandas as pd

POSITIVE_WORDS = {
    "mantap", "bagus", "keren", "hebat", "luar", "biasa", "menang", "dukung", "semangat",
    "menyala", "top", "baik", "suka", "cinta", "percaya", "yakin", "oke", "ok", "solid",
    "maju", "lanjut", "kerja", "kinerja", "berhasil", "cerdas", "tegas", "jujur", "amanah"
}
NEGATIVE_WORDS = {
    "jelek", "buruk", "bohong", "gagal", "benci", "tolak", "korup", "parah", "malas",
    "lemah", "tidak", "ga", "gak", "nggak", "hoax", "fitnah", "ragu", "kecewa", "hancur",
    "salah", "kasar", "bodoh", "payah"
}
POSITIVE_EMOJIS = {"😍", "❤️", "❤", "🔥", "👍", "💪", "👏", "😊", "🙂", "😁"}
NEGATIVE_EMOJIS = {"😡", "👎", "🤮", "😠", "😭", "💩", "😤"}


def normalize_schema(df: pd.DataFrame, source_file: str) -> pd.DataFrame:
    cols = {c.lower(): c for c in df.columns}

    if {"id", "username", "text", "profileurl", "avatarurl", "date"}.issubset(cols):
        out = pd.DataFrame({
            "comment_id": df[cols["id"]].astype(str),
            "created_at": df[cols["date"]],
            "profile_pic_url": df[cols["avatarurl"]],
            "text": df[cols["text"]],
            "user_id": None,
            "username": df[cols["username"]],
        })
    elif {"comment_id", "created_at", "profile_pic_url", "text", "user_id", "username"}.issubset(cols):
        out = pd.DataFrame({
            "comment_id": df[cols["comment_id"]].astype(str),
            "created_at": df[cols["created_at"]],
            "profile_pic_url": df[cols["profile_pic_url"]],
            "text": df[cols["text"]],
            "user_id": df[cols["user_id"]].astype(str),
            "username": df[cols["username"]],
        })
    else:
        raise ValueError(f"Unsupported schema in {source_file}: {list(df.columns)}")

    out["source_file"] = source_file
    return out


def parse_datetime(series: pd.Series) -> pd.Series:
    as_num = pd.to_numeric(series, errors="coerce")
    epoch_mask = as_num.notna() & (as_num > 1000000000)

    parsed = pd.to_datetime(series, errors="coerce")
    if epoch_mask.any():
        parsed.loc[epoch_mask] = pd.to_datetime(as_num.loc[epoch_mask], unit="s", errors="coerce")
    return parsed


def tokenize(text: str):
    text = str(text).lower()
    return re.findall(r"[a-zA-Z0-9_]+", text)


def sentiment_score(text: str) -> tuple[int, str]:
    t = str(text)
    tokens = tokenize(t)
    score = 0

    for w in tokens:
        if w in POSITIVE_WORDS:
            score += 1
        if w in NEGATIVE_WORDS:
            score -= 1

    for ch in t:
        if ch in POSITIVE_EMOJIS:
            score += 1
        elif ch in NEGATIVE_EMOJIS:
            score -= 1

    if score > 0:
        label = "positive"
    elif score < 0:
        label = "negative"
    else:
        label = "neutral"

    return score, label


def read_csv_auto(path: Path) -> pd.DataFrame:
    for enc in ["utf-8", "utf-8-sig", "latin-1"]:
        for sep in [",", ";"]:
            try:
                df = pd.read_csv(
                    path,
                    sep=sep,
                    dtype=str,
                    engine="python",
                    encoding=enc,
                    on_bad_lines="skip",
                )
                if len(df.columns) > 1:
                    return df
            except Exception:
                continue
    raise ValueError(f"Failed to parse CSV: {path}")


def load_post_date_mapping(mapping_csv: Path) -> dict[str, str]:
    mdf = read_csv_auto(mapping_csv)
    cols = {c.strip().lower(): c for c in mdf.columns}
    required = {"file name", "post date"}
    if not required.issubset(cols):
        raise ValueError(f"Mapping CSV must contain columns: {required}")

    out = {}
    for _, row in mdf.iterrows():
        fname = str(row[cols["file name"]]).strip()
        pdate = str(row[cols["post date"]]).strip()
        if fname and fname.lower() != "nan":
            out[fname] = pdate if pdate and pdate.lower() != "nan" else "Unknown"
    return out


def build_dataset(input_dir: Path, source_mapping: dict[str, str] | None = None) -> pd.DataFrame:
    files = sorted(input_dir.glob("*.csv"))
    if not files:
        raise FileNotFoundError(f"No CSV files found in: {input_dir}")

    frames = []
    for f in files:
        if source_mapping is not None and f.name not in source_mapping:
            continue
        df = read_csv_auto(f)
        try:
            normalized = normalize_schema(df, f.name)
        except ValueError:
            continue
        normalized["post_date"] = source_mapping.get(f.name, "Unknown") if source_mapping else "Unknown"
        frames.append(normalized)

    if not frames:
        raise ValueError("No valid comment CSV files matched the schema/mapping.")

    data = pd.concat(frames, ignore_index=True)
    data = data.dropna(subset=["text"]).copy()
    data["text"] = data["text"].astype(str).str.strip()
    data = data[data["text"] != ""].copy()

    data["created_at_dt"] = parse_datetime(data["created_at"])
    data["date_only"] = data["created_at_dt"].dt.date.astype("string")

    scores = data["text"].apply(sentiment_score)
    data["sentiment_score"] = scores.apply(lambda x: x[0])
    data["sentiment_label"] = scores.apply(lambda x: x[1])

    data["text_len"] = data["text"].str.len()
    data = data.drop_duplicates(subset=["comment_id", "username", "text", "source_file"])
    return data


def write_sqlite(df: pd.DataFrame, db_path: Path):
    db_path.parent.mkdir(parents=True, exist_ok=True)
    conn = sqlite3.connect(db_path)
    try:
        df.to_sql("comments", conn, if_exists="replace", index=False)

        summary = (
            df.groupby(["sentiment_label"], as_index=False)
            .agg(total_comments=("comment_id", "count"), avg_score=("sentiment_score", "mean"))
            .sort_values("total_comments", ascending=False)
        )
        summary.to_sql("sentiment_summary", conn, if_exists="replace", index=False)
    finally:
        conn.close()


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--input_dir", type=str, required=True)
    parser.add_argument("--output_db", type=str, required=True)
    parser.add_argument("--output_csv", type=str, required=True)
    parser.add_argument("--mapping_csv", type=str, required=False, default="")
    args = parser.parse_args()

    input_dir = Path(args.input_dir)
    output_db = Path(args.output_db)
    output_csv = Path(args.output_csv)
    source_mapping = None
    if args.mapping_csv:
        source_mapping = load_post_date_mapping(Path(args.mapping_csv))

    df = build_dataset(input_dir, source_mapping=source_mapping)

    output_csv.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(output_csv, index=False, encoding="utf-8")
    write_sqlite(df, output_db)

    print(f"Processed rows: {len(df)}")
    print(f"Output CSV: {output_csv.resolve()}")
    print(f"Output DB : {output_db.resolve()}")


if __name__ == "__main__":
    main()
