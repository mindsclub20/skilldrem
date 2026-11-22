/**
 * Explicit column allowlists for unauthenticated catalogue reads.
 * Keep owner identifiers and internal timestamps out of public projections.
 */
export const PUBLIC_JOURNEY_SELECT =
  "id,slug,title,description,category,difficulty,target_outcome,estimated_hours,is_published,is_featured,cover_image_url";

export const PUBLIC_RESOURCE_SELECT =
  "id,title,description,url,resource_type,provider,language,pricing_type,difficulty,duration_hours,has_certificate,quality_score,is_published";
