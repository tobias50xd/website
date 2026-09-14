import "@fontsource/roboto-mono/latin-400.css";
import "@fontsource/roboto-mono/latin-500.css";
import "./style.css";
import {
  createIcons,
  Menu,
  MapPin,
  ArrowDownRight,
  ArrowUpRight,
  ArrowDown,
  Github,
  Linkedin,
  Instagram,
  Maximize2,
  Terminal,
  Zap,
  Mountain,
  GraduationCap,
  FileText,
  Award,
  Users,
  Server,
  CalendarDays,
  BadgeCheck,
  X,
} from "lucide";
createIcons({
  icons: {
    Menu,
    MapPin,
    ArrowDownRight,
    ArrowUpRight,
    ArrowDown,
    Github,
    Linkedin,
    Instagram,
    Maximize2,
    Terminal,
    Zap,
    Mountain,
    GraduationCap,
    FileText,
    Award,
    Users,
    Server,
    CalendarDays,
    BadgeCheck,
    X,
  },
});

const menu = document.querySelector(".menu-toggle");
const navigation = document.querySelector("#navigation");
function closeMenu() {
  menu.setAttribute("aria-expanded", "false");
  menu.setAttribute("aria-label", "Open navigation");
  navigation.classList.remove("open");
}
menu.addEventListener("click", () => {
  const open = menu.getAttribute("aria-expanded") !== "true";
  menu.setAttribute("aria-expanded", String(open));
  menu.setAttribute(
    "aria-label",
    open ? "Close navigation" : "Open navigation",
  );
  navigation.classList.toggle("open", open);
});
navigation
  .querySelectorAll("a")
  .forEach((link) => link.addEventListener("click", closeMenu));
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") closeMenu();
});
document.addEventListener("click", (event) => {
  if (!event.target.closest(".header")) closeMenu();
});
matchMedia("(min-width: 801px)").addEventListener("change", closeMenu);

const observer = new IntersectionObserver(
  (entries) => {
    entries.forEach((entry) => {
      if (entry.isIntersecting) {
        navigation.querySelectorAll("a").forEach((link) => {
          const active = link.hash === `#${entry.target.id}`;
          link.classList.toggle("active", active);
          if (active) link.setAttribute("aria-current", "location");
          else link.removeAttribute("aria-current");
        });
      }
    });
  },
  { rootMargin: "-15% 0px -60% 0px" },
);
document
  .querySelectorAll("main section[id]")
  .forEach((section) => observer.observe(section));

document.querySelectorAll("[data-filter]").forEach((button) => {
  button.addEventListener("click", () => {
    document.querySelectorAll("[data-filter]").forEach((item) => {
      item.classList.toggle("active", item === button);
      item.setAttribute("aria-pressed", String(item === button));
    });
    document.querySelectorAll("[data-category]").forEach((card) => {
      card.hidden =
        button.dataset.filter !== "all" &&
        card.dataset.category !== button.dataset.filter;
    });
  });
});
const experience = {
  localres: {
    meta: "JUN — NOV 2024 / PASSAU, GERMANY",
    title: "LocalRES",
    role: "Research assistant · University of Passau",
    body: "<p>At the Chair of Computer Networks and Computer Communications, I collaborated on the EU-funded LocalRES project. My work concerned decentralized power distribution in a cell cluster using regional energy trading.</p><h3>The wider research</h3><p>LocalRES explores digital tools for local renewable energy communities. The University of Passau team investigates how flexibility within these communities can improve resilience and help prevent blackouts.</p><h3>What I worked on</h3><ul><li>Collaboration on an EU energy research project.</li><li>Decentralized power distribution within a cell cluster.</li><li>Regional energy trading as part of local energy systems.</li></ul>",
    footer:
      '<a class="button primary" href="https://www.uni-passau.de/forschung/forschungsprojekte/details/research_project/localres" target="_blank" rel="noopener noreferrer">Explore the research project ↗</a><span>Role and dates from my CV. Project context from the University of Passau.</span>',
  },
  bmw: {
    meta: "OCT 2019 — JUN 2020 / MUNICH, GERMANY",
    title: "Navigation with context",
    role: "Voluntary intern · BMW Group, Navigation Services",
    body: "<p>During my voluntary internship in BMW’s Navigation Services Department, I participated in the requirements engineering process and worked on a concept for automatically controlling the content shown by the navigation system.</p><h3>From specification to implementation</h3><ul><li>Participation in requirements engineering.</li><li>Specification and design of an automatic display-control concept.</li><li>Implementation of the concept for navigation display content.</li></ul><p>The role connected software development with the practical question of what a navigation system should show.</p>",
    footer: "<span>Experience and dates from my CV.</span>",
  },
};
const dialog = document.querySelector("#project-dialog");
document.querySelectorAll("[data-project]").forEach((button) =>
  button.addEventListener("click", () => {
    const project = experience[button.dataset.project];
    document.querySelector("#dialog-meta").textContent = project.meta;
    document.querySelector("#dialog-title").textContent = project.title;
    document.querySelector("#dialog-role").textContent = project.role;
    document.querySelector("#dialog-body").innerHTML = project.body;
    document.querySelector(".dialog-footer").innerHTML = project.footer;
    dialog.showModal();
    document.body.classList.add("dialog-open");
  }),
);
document
  .querySelector(".dialog-close")
  .addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => {
  if (event.target === dialog) {
    const rect = dialog.getBoundingClientRect();
    if (
      event.clientX < rect.left ||
      event.clientX > rect.right ||
      event.clientY < rect.top ||
      event.clientY > rect.bottom
    )
      dialog.close();
  }
});
dialog.addEventListener("close", () =>
  document.body.classList.remove("dialog-open"),
);
document.querySelector("#year").textContent = new Date().getFullYear();
