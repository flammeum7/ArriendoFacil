function getPagination(query) {
  let page = parseInt(query.page || '1', 10);
  let limit = parseInt(query.limit || '10', 10);
  if (Number.isNaN(page) || page < 1) page = 1;
  if (Number.isNaN(limit) || limit < 1) limit = 10;
  if (limit > 100) limit = 100;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}

function buildMeta(total, page, limit) {
  return {
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit) || 1,
  };
}

module.exports = { getPagination, buildMeta };
