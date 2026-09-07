import { exposeDeploymentQuery } from "@convex-dev/static-hosting";
import { components } from "./_generated/api";

// static-hosting 0.2.x: the CLI talks to the component's private upload
// functions directly, so the old exposeUploadApi facade is gone. Only the
// deployment query remains for the update banner / live reload hook.
export const { getCurrentDeployment } =
  exposeDeploymentQuery(components.selfHosting);
