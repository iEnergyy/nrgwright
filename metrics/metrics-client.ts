import { InfluxDBClient, Point } from '@influxdata/influxdb3-client';
import dotenv from 'dotenv';

dotenv.config();

const token = process.env.INFLUX_TOKEN || 'Token not found';
const bucket = 'nrgwright';

// Create connection string for the new client
const client = new InfluxDBClient({ host: 'https://us-east-1-1.aws.cloud2.influxdata.com', token: token, database: bucket });

export function writePoint(point: Point) {
  client.write(point);
}

// flush before exit
export async function flushMetrics() {
  await client.close();
}
