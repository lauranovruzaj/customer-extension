const API_URL = 'shopify://customer-account/api/2026-04/graphql.json';

export function gqlFetch(query, variables) {
  return fetch(API_URL, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({query, variables}),
  }).then(res => res.json());
}
