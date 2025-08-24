import { InfluxDB, Point } from '@influxdata/influxdb-client';

const url = process.env.INFLUX_URL!;
const token = process.env.INFLUX_TOKEN!;
const org = process.env.INFLUX_ORG!;
const bucket = process.env.INFLUX_BUCKET!;

const client = new InfluxDB({ url, token });
const writeApi = client.getWriteApi(org, bucket, 'ns');

export function writePoint(point: Point) {
  writeApi.writePoint(point);
}

// flush before exit
export async function flushMetrics() {
  await writeApi.close();
}
