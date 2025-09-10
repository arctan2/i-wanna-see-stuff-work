import { createRouter, createWebHistory, RouteRecordRaw } from "vue-router";

import Dsa from "./data-struct/components/TheBody.vue";

const routes: Array<RouteRecordRaw> = [
	{ path: "/", component: Dsa },
	{ path: "/dsa", component: Dsa },
];

const router = createRouter({
	history: createWebHistory("/i-wanna-see-stuff-work/"),
	routes
});

export default router;
