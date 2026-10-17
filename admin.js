const supabaseConfig = window.GIBCOTECH_SUPABASE;
const adminStatus = document.getElementById("adminStatus");
const loginPanel = document.getElementById("loginPanel");
const adminWorkspace = document.getElementById("adminWorkspace");
const loginForm = document.getElementById("loginForm");
const productForm = document.getElementById("productForm");
const productList = document.getElementById("adminProductList");
const addProductButton = document.getElementById("addProductButton");
const logoutButton = document.getElementById("logoutButton");
const cancelProductButton = document.getElementById("cancelProductButton");
const saveProductButton = document.getElementById("saveProductButton");
const imageInput = productForm.elements.image;
const imagePreviewWrap = document.getElementById("imagePreviewWrap");
const imagePreview = document.getElementById("imagePreview");
const imageBucket = "product-images";
const maxImageBytes = 5 * 1024 * 1024;

let supabaseClient;
let activeUser;
let products = [];
let imagePreviewUrl;

function showStatus(message, type = "info") {
    adminStatus.textContent = message;
    adminStatus.dataset.type = type;
    adminStatus.hidden = !message;
}

function setBusy(isBusy) {
    saveProductButton.disabled = isBusy;
    saveProductButton.textContent = isBusy ? "Saving..." : "Save product";
    addProductButton.disabled = isBusy;
    logoutButton.disabled = isBusy;
    loginForm.querySelector("button").disabled = isBusy;
}

function getStoragePath(imageUrl) {
    if (!imageUrl) return null;

    const marker = `/storage/v1/object/public/${imageBucket}/`;
    const markerIndex = imageUrl.indexOf(marker);
    return markerIndex === -1
        ? null
        : decodeURIComponent(imageUrl.slice(markerIndex + marker.length));
}

function clearImagePreview() {
    if (imagePreviewUrl) {
        URL.revokeObjectURL(imagePreviewUrl);
        imagePreviewUrl = undefined;
    }
    imagePreview.removeAttribute("src");
    imagePreviewWrap.hidden = true;
}

function showImagePreview(imageUrl) {
    clearImagePreview();
    if (!imageUrl) return;

    imagePreview.src = imageUrl;
    imagePreviewWrap.hidden = false;
}

function resetProductForm() {
    productForm.reset();
    productForm.elements.id.value = "";
    document.getElementById("productFormTitle").textContent = "Add a product";
    imageInput.required = false;
    clearImagePreview();
    productForm.hidden = true;
}

function renderProductList() {
    productList.replaceChildren();

    if (products.length === 0) {
        const emptyMessage = document.createElement("p");
        emptyMessage.className = "admin-empty";
        emptyMessage.textContent = "No products yet. Use “Add product” to create the first one.";
        productList.append(emptyMessage);
        return;
    }

    products.forEach((product) => {
        const row = document.createElement("article");
        row.className = "admin-product-row";

        const image = document.createElement("img");
        image.className = "admin-product-thumb";
        image.alt = "";
        image.hidden = !product.image_url;
        if (product.image_url) image.src = product.image_url;

        const details = document.createElement("div");
        details.className = "admin-product-details";

        const title = document.createElement("h3");
        title.textContent = product.name;

        const category = document.createElement("span");
        category.textContent = `${product.category} · KSh ${Number(product.price).toLocaleString("en-KE")}`;

        const description = document.createElement("p");
        description.textContent = product.description || "No description";

        const actions = document.createElement("div");
        actions.className = "admin-product-actions";

        const editButton = document.createElement("button");
        editButton.className = "btn btn-outline";
        editButton.type = "button";
        editButton.textContent = "Edit";
        editButton.addEventListener("click", () => editProduct(product));

        const deleteButton = document.createElement("button");
        deleteButton.className = "btn admin-delete-button";
        deleteButton.type = "button";
        deleteButton.textContent = "Delete";
        deleteButton.addEventListener("click", () => deleteProduct(product));

        details.append(title, category, description);
        actions.append(editButton, deleteButton);
        row.append(image, details, actions);
        productList.append(row);
    });
}

function editProduct(product) {
    productForm.reset();
    productForm.elements.id.value = product.id;
    productForm.elements.name.value = product.name;
    productForm.elements.category.value = product.category;
    productForm.elements.price.value = product.price;
    productForm.elements.description.value = product.description || "";
    document.getElementById("productFormTitle").textContent = "Edit product";
    imageInput.required = false;
    showImagePreview(product.image_url);
    productForm.hidden = false;
    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
}

async function loadProducts() {
    const { data, error } = await supabaseClient
        .from("products")
        .select("id, name, category, price, description, image_url")
        .order("created_at", { ascending: false });

    if (error) throw error;

    products = data || [];
    renderProductList();
    document.getElementById("productCategories").replaceChildren(
        ...[...new Set(products.map((product) => product.category))]
            .sort((first, second) => first.localeCompare(second))
            .map((category) => {
                const option = document.createElement("option");
                option.value = category;
                return option;
            })
    );
}

async function verifyAdmin(user) {
    const { data, error } = await supabaseClient
        .from("admin_users")
        .select("user_id")
        .eq("user_id", user.id)
        .maybeSingle();

    if (error) throw error;
    if (!data) {
        await supabaseClient.auth.signOut();
        throw new Error("This account is not approved for product administration.");
    }

    activeUser = user;
    loginPanel.hidden = true;
    adminWorkspace.hidden = false;
    try {
        await loadProducts();
        showStatus(`Signed in as ${user.email}. Product changes are saved to the live store.`, "success");
    } catch (loadError) {
        showStatus(`Signed in, but products could not be loaded: ${loadError.message}`, "error");
    }
}

async function uploadProductImage(file) {
    const extension = {
        "image/png": "png",
        "image/jpeg": "jpg",
        "image/webp": "webp"
    }[file.type];
    if (!extension) throw new Error("Choose a PNG, JPG or WebP photo.");

    const path = `${activeUser.id}/${crypto.randomUUID()}.${extension}`;
    const { error } = await supabaseClient.storage
        .from(imageBucket)
        .upload(path, file, { contentType: file.type, upsert: false });

    if (error) throw error;

    const { data } = supabaseClient.storage
        .from(imageBucket)
        .getPublicUrl(path);

    return { path, url: data.publicUrl };
}

async function saveProduct(event) {
    event.preventDefault();
    showStatus("");

    const formData = new FormData(productForm);
    const id = formData.get("id");
    const name = String(formData.get("name") || "").trim();
    const category = String(formData.get("category") || "").trim();
    const price = Number(formData.get("price"));
    const description = String(formData.get("description") || "").trim();
    const file = imageInput.files[0];
    const existing = products.find((product) => product.id === id);

    if (!name || !category || !Number.isFinite(price) || price < 0) {
        showStatus("Enter a product name, category and valid non-negative price.", "error");
        return;
    }
    if (!existing && !file) {
        showStatus("Choose a product photo before adding a product.", "error");
        return;
    }
    if (file && (!["image/png", "image/jpeg", "image/webp"].includes(file.type) || file.size > maxImageBytes)) {
        showStatus("Choose a PNG, JPG or WebP photo no larger than 5 MB.", "error");
        return;
    }

    setBusy(true);
    let uploadedImage;
    let productSaved = false;

    try {
        let imageUrl = existing?.image_url || null;
        if (file) {
            uploadedImage = await uploadProductImage(file);
            imageUrl = uploadedImage.url;
        }

        const product = { name, category, price, description, image_url: imageUrl };
        const query = existing
            ? supabaseClient.from("products").update(product).eq("id", id)
            : supabaseClient.from("products").insert(product);
        const { data: savedProduct, error } = await query.select("id").single();
        if (error) throw error;
        if (!savedProduct) throw new Error("The product was not saved.");
        productSaved = true;

        let cleanupWarning;
        if (file && existing?.image_url) {
            const oldPath = getStoragePath(existing.image_url);
            if (oldPath) {
                const { error: cleanupError } = await supabaseClient.storage
                    .from(imageBucket)
                    .remove([oldPath]);
                if (cleanupError) cleanupWarning = cleanupError.message;
            }
        }

        resetProductForm();
        try {
            await loadProducts();
        } catch (loadError) {
            showStatus(`Product saved, but the list could not refresh: ${loadError.message}`, "error");
            return;
        }
        showStatus(
            cleanupWarning
                ? `Product saved, but its old photo could not be removed: ${cleanupWarning}`
                : "Product saved successfully.",
            cleanupWarning ? "error" : "success"
        );
    } catch (error) {
        if (uploadedImage && !productSaved) {
            const { error: cleanupError } = await supabaseClient.storage
                .from(imageBucket)
                .remove([uploadedImage.path]);
            if (cleanupError) {
                console.error("Could not clean up the uploaded photo:", cleanupError);
            }
        }
        showStatus(`Could not save the product: ${error.message}`, "error");
    } finally {
        setBusy(false);
    }
}

async function deleteProduct(product) {
    if (!window.confirm(`Delete "${product.name}"? This cannot be undone.`)) return;

    showStatus("");
    setBusy(true);
    let productDeleted = false;
    try {
        const { data: deletedProduct, error } = await supabaseClient
            .from("products")
            .delete()
            .eq("id", product.id)
            .select("id")
            .maybeSingle();
        if (error) throw error;
        if (!deletedProduct) {
            throw new Error("The product was not found or deletion was denied.");
        }
        productDeleted = true;

        const imagePath = getStoragePath(product.image_url);
        let cleanupWarning;
        if (imagePath) {
            const { error: cleanupError } = await supabaseClient.storage
                .from(imageBucket)
                .remove([imagePath]);
            if (cleanupError) cleanupWarning = cleanupError.message;
        }

        try {
            await loadProducts();
        } catch (loadError) {
            showStatus(`Product deleted, but the list could not refresh: ${loadError.message}`, "error");
            return;
        }
        showStatus(
            cleanupWarning
                ? `Product deleted, but its photo could not be removed: ${cleanupWarning}`
                : "Product deleted.",
            cleanupWarning ? "error" : "success"
        );
    } catch (error) {
        showStatus(
            productDeleted
                ? `Product deleted, but follow-up cleanup failed: ${error.message}`
                : `Could not delete the product: ${error.message}`,
            "error"
        );
    } finally {
        setBusy(false);
    }
}

if (!supabaseConfig?.url || !supabaseConfig?.anonKey) {
    showStatus("Connect this site to Supabase first. Follow the setup steps in SUPABASE_SETUP.md.", "error");
    loginForm.querySelector("button").disabled = true;
} else if (!window.supabase?.createClient) {
    showStatus("The Supabase client could not load. Check your internet connection and reload this page.", "error");
    loginForm.querySelector("button").disabled = true;
} else {
    supabaseClient = window.supabase.createClient(
        supabaseConfig.url,
        supabaseConfig.anonKey
    );

    loginForm.addEventListener("submit", async (event) => {
        event.preventDefault();
        showStatus("Signing in...");
        const formData = new FormData(loginForm);
        loginForm.querySelector("button").disabled = true;

        try {
            const { data, error } = await supabaseClient.auth.signInWithPassword({
                email: formData.get("email"),
                password: formData.get("password")
            });

            if (error) throw error;
            await verifyAdmin(data.user);
        } catch (verificationError) {
            loginPanel.hidden = false;
            adminWorkspace.hidden = true;
            const details = verificationError.message === "Email not confirmed"
                ? "Confirm the registration email first, or disable email confirmations in Supabase Auth settings, then sign in again."
                : verificationError.message;
            showStatus(`Sign in failed: ${details}`, "error");
        } finally {
            loginForm.querySelector("button").disabled = false;
        }
    });

    supabaseClient.auth.getSession().then(async ({ data, error }) => {
        if (error) throw error;
        if (data.session) {
            await verifyAdmin(data.session.user);
        }
    }).catch((error) => {
        showStatus(`Could not restore the admin session: ${error.message}`, "error");
    });
}

addProductButton.addEventListener("click", () => {
    resetProductForm();
    productForm.hidden = false;
    productForm.elements.name.focus();
    productForm.scrollIntoView({ behavior: "smooth", block: "start" });
});

cancelProductButton.addEventListener("click", resetProductForm);
productForm.addEventListener("submit", saveProduct);

imageInput.addEventListener("change", () => {
    const file = imageInput.files[0];
    clearImagePreview();
    if (file) {
        imagePreviewUrl = URL.createObjectURL(file);
        imagePreview.src = imagePreviewUrl;
        imagePreviewWrap.hidden = false;
    } else {
        const existing = products.find((product) => product.id === productForm.elements.id.value);
        showImagePreview(existing?.image_url);
    }
});

logoutButton.addEventListener("click", async () => {
    if (!supabaseClient) return;
    try {
        const { error } = await supabaseClient.auth.signOut();
        if (error) throw error;

        activeUser = undefined;
        adminWorkspace.hidden = true;
        loginPanel.hidden = false;
        resetProductForm();
        showStatus("You have signed out.", "success");
    } catch (error) {
        showStatus(`Could not sign out: ${error.message}`, "error");
    }
});
