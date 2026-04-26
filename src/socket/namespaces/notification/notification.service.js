const handleNotificationRead = async ({ payload = {} }) => ({
  success: true,
  payload,
});

module.exports = {
  handleNotificationRead,
};
