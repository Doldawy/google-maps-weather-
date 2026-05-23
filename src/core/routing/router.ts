import { CoreRequest } from "../../types/request";

export class CoreRouter {
  public route(request: CoreRequest): void {
    this.logIntake(request);

    if (request.environment === "prod") {
      this.enforceBudget(request);
    }

    // TODO: connect to agent registry / workflows
  }

  private logIntake(request: CoreRequest): void {
    console.log("[INTAKE]", request.id, request.source, request.channel);
  }

  private enforceBudget(request: CoreRequest): void {
    console.log("[BUDGET CHECK]", request.id, request.budgetTag);
  }
}
