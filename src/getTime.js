import dayjs from "dayjs";

export default function getTime(feature) {
  const unixTime = feature.properties.unixtime;
  const offset = feature.properties.offset || 0;
  return dayjs(unixTime).add(offset, "hours").format("dddd HH:mm - DD/MM/YYYY");
}
