function generateMessage(message, username) {
  const date = new Date();
  return {
    message,
    created_at: date.getTime(),
    username,
  };
}
function generateLocationMessage(lat, long, username) {
  return {
    url: `https://www.mapquestapi.com/staticmap/v4/getmap?key=9kLHVGzo2UeaGZUp7zW6n1CZMnIqTLxe&size=250,200&zoom=16&center=${lat},${long}`,
    created_at: new Date().getTime(),
    username,
  };
}
module.exports = {
  generateMessage,
  generateLocationMessage,
};
