const parsePageAndLimitNumber = (pageNo: number, limit: number) => {
  const page = pageNo <= 0 ? 1 : pageNo;
  const rows = limit <= 0 ? 20 : limit;

  return { page, rows };
};

export { parsePageAndLimitNumber };
