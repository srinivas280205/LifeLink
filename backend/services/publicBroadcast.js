// Feed events never contain private contact numbers or requester GPS.
function publicBroadcast(document) {
  const value = document.toObject ? document.toObject() : { ...document };
  delete value.requesterPhone;
  delete value.sosLocation;
  value.responses = (value.responses || []).map(response => {
    const { donorPhone, ...safe } = response;
    return safe;
  });
  return value;
}
module.exports = { publicBroadcast };
