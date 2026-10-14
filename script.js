
const products = [
    {
        name: "Hikvision CCTV Cameras",
        category: "Security",
        price: 3500,
        image: "images/hikvision-cctv.png"
    },
    {
        name: "Hikvision DVR Recorder",
        category: "Security",
        price: 5500,
        image: "images/hikvision-dvr.png"
    },
    {
        name: "CCTV Installation Services",
        category: "Security",
        price: 5000,
        image: "images/cctvinstallation-services.png"
    },
    {
        name: "4K Smart TV Box",
        category: "TV Accessories",
        price: 3500,
        image: "images/tvbox.png"
    },
    {
        name: "HDMI Cables",
        category: "TV Accessories",
        price: 800,
        image: "images/hdmi-cables.png"
    },
    {
        name: "Wireless CCTV Camera",
        category: "Security",
        price: 4500,
        image: "images/wireless-cameras.png"
    },
    {
        name: "Computer Monitors",
        category: "Computers",
        price: 8000,
        image: "images/computer-monitors.png"
    },
    {
        name: "Laptop Charger",
        category: "Accessories",
        price: 1000,
        image: "images/laptop-charger.png"
    },
    {
        name: "Computer RAM",
        category: "Accessories",
        price: 1500,
        image: "images/computer-ram.png"
    },
    {
        name: "Solid State Drive (SSD)",
        category: "Storage",
        price: 2500,
        image: "images/ssd.png"
    }
];

const productGrid = document.getElementById("productGrid");
const productSearch = document.getElementById("productSearch");
const categoryFilter = document.getElementById("categoryFilter");
const phoneDisplay = document.getElementById("phoneDisplay");

function getWhatsAppUrl(message) {
    const phoneDigits = (
        phoneDisplay?.textContent || "0727390243"
    ).replace(/\D/g, "");

    const internationalPhone = phoneDigits.startsWith("0")
        ? `254${phoneDigits.slice(1)}`
        : phoneDigits;

    return `https://wa.me/${internationalPhone}?text=${encodeURIComponent(message)}`;
}

function createProductCard(product) {
    const card = document.createElement("article");
    card.className = "product-card";

    // PRODUCT IMAGE ONLY — NO ICONS OR EMOJI PLACEHOLDERS
    const imageContainer = document.createElement("div");
    imageContainer.className = "product-image";

    const img = document.createElement("img");
    img.src = product.image;
    img.alt = product.name;
    img.loading = "lazy";

    // Keep the image area empty if the image file is missing.
    img.addEventListener("error", () => {
        img.remove();
    });

    imageContainer.appendChild(img);

    const info = document.createElement("div");
    info.className = "product-info";

    const category = document.createElement("span");
    category.className = "product-category";
    category.textContent = product.category;

    const title = document.createElement("h3");
    title.textContent = product.name;

    const description = document.createElement("p");
    description.className = "product-description";
    description.textContent = product.description || "";

    const price = document.createElement("p");
    price.className = "product-price";
    price.textContent = `KSh ${Number(product.price).toLocaleString("en-KE")}`;

    const enquiry = document.createElement("a");
    enquiry.className = "btn";
    enquiry.href = getWhatsAppUrl(
        `Hello, I would like to enquire about ${product.name}.`
    );
    enquiry.target = "_blank";
    enquiry.rel = "noopener noreferrer";
    enquiry.textContent = "Enquire on WhatsApp";

    info.append(category, title, description, price, enquiry);
    card.append(imageContainer, info);

    return card;
}

function renderProducts() {
    if (!productGrid) return;

    const searchTerm = (productSearch?.value || "")
        .trim()
        .toLowerCase();

    const selectedCategory = categoryFilter?.value || "all";

    const visibleProducts = products.filter((product) => {
        const categoryMatches =
            selectedCategory === "all" ||
            product.category === selectedCategory;

        const searchableText =
            `${product.name} ${product.category} ${product.description || ""}`
                .toLowerCase();

        return categoryMatches && searchableText.includes(searchTerm);
    });

    productGrid.replaceChildren();

    if (visibleProducts.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "no-products";
        emptyMessage.textContent =
            "No products match your search. Try another term or category.";

        productGrid.append(emptyMessage);
        return;
    }

    productGrid.append(...visibleProducts.map(createProductCard));
}

function populateCategoryFilter() {
    if (!categoryFilter) return;

    const categories = [
        ...new Set(products.map((product) => product.category))
    ].sort((first, second) => first.localeCompare(second));

    categoryFilter.replaceChildren(
        new Option("All Categories", "all")
    );

    categories.forEach((category) => {
        categoryFilter.add(new Option(category, category));
    });
}

populateCategoryFilter();
renderProducts();

productSearch?.addEventListener("input", renderProducts);
categoryFilter?.addEventListener("change", renderProducts);

document.querySelectorAll(".whatsapp-link").forEach((link) => {
    link.href = getWhatsAppUrl(
        "Hello, I would like to enquire about your products and services."
    );

    link.target = "_blank";
    link.rel = "noopener noreferrer";
});

const currentYear = document.getElementById("currentYear");

if (currentYear) {
    currentYear.textContent = new Date().getFullYear();
}

const menuToggle = document.getElementById("menuToggle");
const mainNav = document.getElementById("mainNav");

menuToggle?.addEventListener("click", () => {
    const isOpen = mainNav?.classList.toggle("open") || false;

    menuToggle.setAttribute("aria-expanded", String(isOpen));
    menuToggle.setAttribute(
        "aria-label",
        isOpen ? "Close navigation" : "Open navigation"
    );
});

mainNav?.querySelectorAll("a").forEach((link) => {
    link.addEventListener("click", () => {
        mainNav.classList.remove("open");
        menuToggle?.setAttribute("aria-expanded", "false");
        menuToggle?.setAttribute("aria-label", "Open navigation");
    });
});
