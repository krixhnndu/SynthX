import boto3

from app.config import settings
from app.storage.base import StorageAdapter


class S3Storage(StorageAdapter):
    def __init__(self) -> None:
        self.client = boto3.client("s3", region_name=settings.s3_region)
        self.bucket = settings.s3_bucket

    def put(self, key: str, data: bytes, content_type: str | None = None) -> str:
        self.client.put_object(
            Bucket=self.bucket, Key=key, Body=data,
            ContentType=content_type or "application/octet-stream",
            ServerSideEncryption="AES256",
        )
        return f"s3://{self.bucket}/{key}"

    def get(self, ref: str) -> bytes:
        key = ref.split(f"s3://{self.bucket}/", 1)[1]
        return self.client.get_object(Bucket=self.bucket, Key=key)["Body"].read()

    def url(self, ref: str, expires_seconds: int = 900) -> str:
        key = ref.split(f"s3://{self.bucket}/", 1)[1]
        return self.client.generate_presigned_url(
            "get_object", Params={"Bucket": self.bucket, "Key": key}, ExpiresIn=expires_seconds
        )
