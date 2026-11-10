import { ALARMS, ASSETS, childrenOf, findAsset, findPerson, SENSORS, sensorsOf, WORK_ORDERS } from './plant';

describe('plant data', () => {
  it('has unique ids in every collection', () => {
    for (const collection of [ASSETS, SENSORS, ALARMS, WORK_ORDERS]) {
      const ids = collection.map((record) => record.id);
      expect(new Set(ids).size).toBe(ids.length);
    }
  });

  it('links every asset to an existing parent', () => {
    for (const asset of ASSETS) {
      if (asset.parentId !== null) expect(findAsset(asset.parentId), asset.id).toBeDefined();
    }
  });

  it('links sensors, alarms and work orders to existing assets', () => {
    for (const record of [...SENSORS, ...ALARMS, ...WORK_ORDERS]) {
      expect(findAsset(record.assetId), record.id).toBeDefined();
    }
  });

  it('links assigned work orders to existing people', () => {
    for (const order of WORK_ORDERS) {
      if (order.assigneeId !== null) expect(findPerson(order.assigneeId), order.id).toBeDefined();
    }
  });

  it('keeps sensor limits inside the sensor range', () => {
    for (const sensor of SENSORS) {
      expect(sensor.rangeMin, sensor.tag).toBeLessThanOrEqual(sensor.lowLimit);
      expect(sensor.highLimit, sensor.tag).toBeLessThanOrEqual(sensor.rangeMax);
    }
  });

  it('finds children and sensors of an asset', () => {
    expect(childrenOf(null).map((asset) => asset.id)).toEqual(['nk']);
    expect(childrenOf('nk-27').map((asset) => asset.tag)).toEqual(['27-PA-2001A', '27-PA-2001B']);
    expect(sensorsOf('20-va-1001').map((sensor) => sensor.tag)).toEqual(['20-LT-10012', '20-PT-10010']);
  });

  it('returns undefined for unknown ids', () => {
    expect(findAsset('nope')).toBeUndefined();
    expect(findPerson(null)).toBeUndefined();
  });
});
