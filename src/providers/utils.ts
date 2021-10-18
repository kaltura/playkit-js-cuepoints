export const DEFAULT_SERVICE_URL = '//cdnapisec.kaltura.com/api_v3';
export const END_TIME_DELTA = 0.01;

export function isEmptyObject(obj: Record<string, any>) {
  return Object.keys(obj).length === 0 && obj.constructor === Object;
}

export function getDomainFromUrl(url: string) {
  return url.replace(/^(.*\/\/[^\/?#]*).*$/, '$1');
}

export function makeAssetUrl(serviceUrl: string = DEFAULT_SERVICE_URL, assetId: string, ks: string = '') {
  return `${serviceUrl}/index.php/service/thumbAsset/action/serve/thumbAssetId/${assetId}/ks/${ks}`;
}

export function prepareEndTime(endTime: number) {
  return endTime - END_TIME_DELTA;
}
