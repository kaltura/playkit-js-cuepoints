import {Provider, ProviderRequest, DEFAULT_SERVICE_URL} from '../provider';
import {ThumbLoader} from './thumb-loader';
import {KalturaThumbCuePoint} from './response-types';
import {KalturaCuePointType, KalturaThumbCuePointSubType, CuepointTypeMap} from '../../types';
import Player = KalturaPlayerTypes.Player;
import Logger = KalturaPlayerTypes.Logger;
import EventManager = KalturaPlayerTypes.EventManager;
import {makeAssetUrl} from '../utils';

export class VodProvider extends Provider {
  constructor(player: Player, eventManager: EventManager, logger: Logger, types: CuepointTypeMap) {
    super(player, eventManager, logger, types);
    this._fetchVodData();
  }

  _fetchVodData() {
    let thumbSubTypesFilter = '';
    if (this._types.has(KalturaCuePointType.SLIDE)) {
      thumbSubTypesFilter = `${KalturaThumbCuePointSubType.SLIDE},`;
    }

    // preparation for chapters
    // if (this._types.has(KalturaCuePoints.KalturaCuePointType.CHAPTER)) {
    //   subTypesFilter = `${subTypesFilter}${KalturaCuePoints.KalturaThumbCuePointSubType.CHAPTER},`;
    // }

    let requests: Array<ProviderRequest> = [];
    if (thumbSubTypesFilter) {
      requests.push({loader: ThumbLoader, params: {entryId: this._player.getMediaInfo().entryId, subTypesFilter: thumbSubTypesFilter}});
    }
    if (requests.length) {
      this._player.provider
        .doRequest(requests)
        .then((data: Map<string, any>) => {
          if (data && data.has(ThumbLoader.id)) {
            this._handleThumbResponse(data);
          }
        })
        .catch((e: any) => {
          this._logger.warn('Provider cue points doRequest was rejected');
        });
    }
  }

  private _handleThumbResponse(data: Map<string, any>) {
    function createCuePointList(thumbCuePoints: Array<KalturaThumbCuePoint>, ks: string, serviceUrl: string) {
      return thumbCuePoints.map((thumbCuePoint: KalturaThumbCuePoint) => {
        return {
          assetUrl: makeAssetUrl(serviceUrl, thumbCuePoint.assetId, ks),
          id: thumbCuePoint.id,
          cuePointType: thumbCuePoint.cuePointType,
          startTime: thumbCuePoint.startTime / 1000
        };
      });
    }

    function sortCuepoints(cuePoints: {cuePointType: string; startTime: number; id: string; assetUrl: string}[]) {
      return cuePoints.sort(function (a: any, b: any) {
        return a.startTime - b.startTime;
      });
    }

    function fixCuePointsEndTime(cuePoints: {cuePointType: string; startTime: number; id: string; assetUrl: string}[]) {
      return cuePoints.map((cuePoint: any, index: number) => {
        if (!cuePoint.endTime) {
          return {
            ...cuePoint,
            endTime: index === cuePoints.length - 1 ? Number.MAX_SAFE_INTEGER : cuePoints[index + 1].startTime
          };
        }
        return cuePoint;
      });
    }

    const thumbCuePointsLoader: ThumbLoader = data.get(ThumbLoader.id);
    const thumbCuePoints: Array<KalturaThumbCuePoint> = thumbCuePointsLoader?.response.thumbCuePoints || [];
    this._logger.debug(`_fetchVodData response successful with ${thumbCuePoints.length} cue points`);
    const ks = this._player.config.session.ks || '';
    const serviceUrl = this._player.config.provider.env?.serviceUrl || DEFAULT_SERVICE_URL;
    if (thumbCuePoints.length) {
      let cuePoints = createCuePointList(thumbCuePoints, ks, serviceUrl);
      cuePoints = sortCuepoints(cuePoints);
      cuePoints = fixCuePointsEndTime(cuePoints);
      this._player.cuePointManager.addCuePoints(cuePoints);
    }
  }
}
