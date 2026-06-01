const permissionMapRoute = {
  "POST /api/roles/create-role": { module: "roles_add", action: "view" },
  "GET /api/roles/all-roles": { module: "roles_all", action: "view" },
  "GET /api/roles/role/:id": { module: "roles_single", action: "view" },
  "PUT /api/roles/role/:id": { module: "roles_edit", action: "view" },
  "DELETE /api/roles/role/:id": { module: "roles_delete", action: "view" },
};

export default permissionMapRoute;
