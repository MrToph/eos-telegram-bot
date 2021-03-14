import UserController from "./controller/UserController";
import NotificationController from "./controller/NotificationController";
import InfoController from "./controller/InfoController";
import HealthController from "./controller/HealthController";

export const Routes = [
    {
        method: "get",
        route: "/users",
        controller: UserController,
        action: "all"
    },
    {
        method: "post",
        route: "/notify",
        controller: NotificationController,
        action: "notify",
        isAuthenticated: true,
    },
    {
        method: "get",
        route: "/info",
        controller: InfoController,
        action: "version"
    },
    {
        method: "get",
        route: "/health",
        controller: HealthController,
        action: "version"
    },
];