exports.buildPatchUpdate = ({ data, basePath = '' }) => {
  const $set = {};

  Object.entries(data).forEach(([key, value]) => {
    const fullPath = basePath ? `${basePath}.${key}` : key;
    $set[fullPath] = value;
  });

  return Object.keys($set).length ? { $set } : {};
};