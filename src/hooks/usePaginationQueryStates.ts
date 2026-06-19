import { parseAsInteger, useQueryStates } from "nuqs";

export const usePaginationQueryStates = () => {
  const [{ currentPage, limit }, setPagination] = useQueryStates(
    {
      currentPage: parseAsInteger.withDefault(1),
      limit: parseAsInteger.withDefault(10),
    },
    {
      urlKeys: {
        currentPage: "page",
      },
    },
  );

  return { currentPage, limit, setPagination };
};
