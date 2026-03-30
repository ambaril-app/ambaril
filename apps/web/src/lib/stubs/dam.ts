// TODO: Replace when DAM module is implemented

interface CreatorKitAsset {
  id: string;
  name: string;
  type: "logo" | "photo" | "guideline" | "template";
  thumbnailUrl: string | null;
  downloadUrl: string | null;
}

export async function getCreatorKitAssets(): Promise<CreatorKitAsset[]> {
  // TODO: Replace with real DAM asset query when dam module is implemented
  return [];
}

export async function getAssetDownloadUrl(
  _assetId: string,
): Promise<string | null> {
  // TODO: Replace with real DAM presigned URL when dam module is implemented
  return null;
}
