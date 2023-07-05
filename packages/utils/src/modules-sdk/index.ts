import { DAL, FindConfig } from "@medusajs/types"
import { isObject } from "../common"

export * from "./load-module-database-config"

export function deduplicateIfNecessary<T = any>(collection: T | T[]) {
  return Array.isArray(collection) ? [...new Set(collection)] : collection
}

export function buildQuery<T = any, TDto = any>(
  filters: Record<string, any> = {},
  config: FindConfig<TDto> = {}
): DAL.FindOptions<T> {
  const where: DAL.FilterQuery<T> = {}
  buildWhere(filters, where)

  const entityFilters = {}

  if (config.withDeleted) {
    entityFilters["softDeletable"] = {
      withDeleted: true,
    }
  }

  const findOptions: DAL.OptionsQuery<T, any> = {
    populate: config.relations ?? [],
    fields: config.select,
    limit: config.take,
    offset: config.skip,
    filters: entityFilters,
  } as any

  return { where, options: findOptions }
}

function buildWhere(filters: Record<string, any> = {}, where = {}) {
  for (let [prop, value] of Object.entries(filters)) {
    if (Array.isArray(value)) {
      value = deduplicateIfNecessary(value)
      where[prop] = ["$in", "$nin"].includes(prop) ? value : { $in: value }
      continue
    }

    if (isObject(value)) {
      where[prop] = {}
      buildWhere(value, where[prop])
      continue
    }

    where[prop] = value
  }
}
