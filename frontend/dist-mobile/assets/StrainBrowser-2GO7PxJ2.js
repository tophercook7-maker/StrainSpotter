var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
import { r as reactExports, j as jsxRuntimeExports, B as Box, I as IconButton, y as ArrowBackIcon, T as Typography, C as Container, S as Stack, P as Paper, a0 as Grid, m as TextField, aR as InputAdornment, ai as CloseIcon, aS as SearchIcon, ae as FormControl, af as InputLabel, ag as Select, ah as MenuItem, i as Button, aT as FilterListIcon, ak as Slider, Q as Tooltip, H as Chip, aU as FavoriteIcon, aV as FavoriteBorderIcon, n as CircularProgress, D as Dialog, p as DialogTitle, a5 as NoteAltIcon, aW as LibraryBooksIcon, q as DialogContent, k as Tabs, l as Tab, as as Snackbar, A as Alert, aI as List, aJ as ListItem, aX as ListItemIcon, a8 as StoreIcon, aK as ListItemText, aj as LocationOn, aY as AttachMoneyIcon, V as VerifiedIcon, L as LocalFloristIcon } from "./react-vendor-DaVUs1pH.js";
import { s as supabase, a as API_BASE } from "./App-BxlAc3TE.js";
import { S as SeedVendorFinder } from "./SeedVendorFinder-CxxEvy7T.js";
import { J as JournalDialog } from "./JournalDialog-z8hMBNLf.js";
import { E as EmptyStateCard } from "./EmptyStateCard-BPZgdi7J.js";
import { u as useStrainImage } from "./useStrainImage-Dsgj-zte.js";
import "./vendor-qR99EfKL.js";
import "./BackHeader-jwQJOBEe.js";
const STRAINS_PER_PAGE = 100;
const FETCH_BATCH_SIZE = 1e3;
const getStrainImageUrl = /* @__PURE__ */ __name((strain) => {
  if (!strain) return null;
  const candidates = [
    strain.thumbnail_url,
    // Prioritize thumbnail for faster loading
    strain.image_url,
    strain.photo_url,
    strain.main_image,
    strain.leafly_image,
    strain.hero_image_url,
    strain.image,
    strain.imageUrl
  ];
  return candidates.find((u) => typeof u === "string" && u.startsWith("http")) || null;
}, "getStrainImageUrl");
function StrainImageCard({ strain }) {
  const canonicalName = strain?.name || strain?.canonicalName || null;
  const { imageUrl: apiImageUrl } = useStrainImage(canonicalName);
  const localImageUrl = getStrainImageUrl(strain);
  const imageUrl = apiImageUrl || localImageUrl;
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
    imageUrl ? /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        component: "img",
        src: imageUrl,
        alt: strain?.name || "Strain photo",
        loading: "lazy",
        sx: {
          width: "100%",
          height: "100%",
          objectFit: "cover",
          display: "block",
          background: "#111"
        },
        onError: /* @__PURE__ */ __name((e) => {
          e.currentTarget.style.display = "none";
          const placeholder = e.currentTarget.parentElement?.querySelector(".strain-placeholder");
          if (placeholder) {
            placeholder.style.display = "flex";
          }
        }, "onError")
      }
    ) : null,
    /* @__PURE__ */ jsxRuntimeExports.jsx(
      Box,
      {
        className: "strain-placeholder",
        sx: {
          display: imageUrl ? "none" : "flex",
          alignItems: "center",
          justifyContent: "center",
          width: "100%",
          height: "100%",
          position: "absolute",
          top: 0,
          left: 0,
          background: "linear-gradient(135deg, rgba(124, 179, 66, 0.15) 0%, rgba(0, 0, 0, 0.4) 100%)",
          border: "1px solid rgba(124, 179, 66, 0.2)"
        },
        children: /* @__PURE__ */ jsxRuntimeExports.jsx(
          Typography,
          {
            variant: "caption",
            sx: {
              color: "rgba(200, 230, 201, 0.6)",
              fontSize: 11,
              textAlign: "center",
              px: 2,
              fontWeight: 500
            },
            children: "No strain photo yet"
          }
        )
      }
    )
  ] });
}
__name(StrainImageCard, "StrainImageCard");
function StrainBrowser({ onBack }) {
  const [strains, setStrains] = reactExports.useState([]);
  const [filteredStrains, setFilteredStrains] = reactExports.useState([]);
  const [displayedStrains, setDisplayedStrains] = reactExports.useState([]);
  const [loading, setLoading] = reactExports.useState(true);
  const [searchQuery, setSearchQuery] = reactExports.useState("");
  const [typeFilter, setTypeFilter] = reactExports.useState("all");
  const [selectedStrain, setSelectedStrain] = reactExports.useState(null);
  const [detailsOpen, setDetailsOpen] = reactExports.useState(false);
  const [detailsTab, setDetailsTab] = reactExports.useState(0);
  const [vendors, setVendors] = reactExports.useState([]);
  const [dispensaries, setDispensaries] = reactExports.useState([]);
  const [reviews, setReviews] = reactExports.useState([]);
  const [userLocation, setUserLocation] = reactExports.useState(null);
  const [loadingLocation, setLoadingLocation] = reactExports.useState(true);
  const [page, setPage] = reactExports.useState(0);
  const [hasMore, setHasMore] = reactExports.useState(true);
  const [allStrainsLoaded, setAllStrainsLoaded] = reactExports.useState(false);
  const [sortBy, setSortBy] = reactExports.useState("type");
  const [thcRange, setThcRange] = reactExports.useState([0, 35]);
  const [favorites, setFavorites] = reactExports.useState([]);
  const [showFilters, setShowFilters] = reactExports.useState(false);
  const [snackbar, setSnackbar] = reactExports.useState({ open: false, message: "", severity: "success" });
  const [showSeedFinder, setShowSeedFinder] = reactExports.useState(false);
  const [showingFavorites, setShowingFavorites] = reactExports.useState(false);
  const [journalDialogOpen, setJournalDialogOpen] = reactExports.useState(false);
  const [journalDefaults, setJournalDefaults] = reactExports.useState(null);
  const [maxToShow, setMaxToShow] = reactExports.useState(300);
  const observerTarget = reactExports.useRef(null);
  const handleLogExperience = /* @__PURE__ */ __name((strain) => {
    if (!strain) return;
    setJournalDefaults({
      strain_name: strain.name,
      strain_slug: strain.slug
    });
    setJournalDialogOpen(true);
  }, "handleLogExperience");
  reactExports.useEffect(() => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          console.log("[StrainBrowser] Location obtained successfully");
          setUserLocation({
            lat: position.coords.latitude,
            lng: position.coords.longitude
          });
          setLoadingLocation(false);
        },
        (error) => {
          console.log("[StrainBrowser] Location denied or unavailable:", error.message);
          setUserLocation({ lat: 37.7749, lng: -122.4194 });
          setLoadingLocation(false);
        },
        {
          timeout: 5e3,
          maximumAge: 3e5,
          // 5 min cache
          enableHighAccuracy: false
        }
      );
    } else {
      console.log("[StrainBrowser] Geolocation not supported");
      setUserLocation({ lat: 37.7749, lng: -122.4194 });
      setLoadingLocation(false);
    }
  }, []);
  const fetchStrainsFromSupabase = reactExports.useCallback(async () => {
    if (!supabase) return [];
    let allData = [];
    let from = 0;
    const batchSize = FETCH_BATCH_SIZE;
    let hasMoreData = true;
    while (hasMoreData) {
      const to = from + batchSize - 1;
      const { data, error, count } = await supabase.from("strains").select("*", { count: "exact" }).order("name").range(from, to);
      if (error) throw error;
      if (data && data.length > 0) {
        allData = [...allData, ...data];
        if (count && allData.length < count) {
          from += batchSize;
        } else {
          hasMoreData = false;
        }
      } else {
        hasMoreData = false;
      }
    }
    return allData;
  }, [supabase]);
  const fetchStrainsFromApi = reactExports.useCallback(async () => {
    let results = [];
    let pageIndex = 1;
    let totalPages = 1;
    while (pageIndex <= totalPages) {
      const res = await fetch(`${API_BASE}/api/strains?page=${pageIndex}&limit=${FETCH_BATCH_SIZE}`);
      if (!res.ok) {
        throw new Error(`HTTP ${res.status} when fetching strains from API`);
      }
      const payload = await res.json();
      const pageStrains = Array.isArray(payload?.strains) ? payload.strains : [];
      results = [...results, ...pageStrains];
      totalPages = payload?.pages || 1;
      if (pageStrains.length === 0) {
        break;
      }
      pageIndex += 1;
    }
    return results;
  }, [API_BASE]);
  const fetchAllStrains = reactExports.useCallback(async () => {
    try {
      setLoading(true);
      console.log("🔍 Fetching ALL strains from database...");
      let allData = [];
      let usedSupabase = false;
      if (supabase) {
        try {
          allData = await fetchStrainsFromSupabase();
          usedSupabase = allData.length > 0;
          if (usedSupabase) {
            console.log(`✅ Loaded ${allData.length} total strains from Supabase!`);
          } else {
            console.warn("Supabase returned 0 strains, attempting API fallback...");
          }
        } catch (supabaseError) {
          console.error("❌ Supabase error fetching strains:", supabaseError);
        }
      }
      if (!allData.length) {
        console.log("🌐 Falling back to local API for strain data...");
        allData = await fetchStrainsFromApi();
        console.log(`✅ Loaded ${allData.length} strains via API fallback`);
      }
      if (!allData.length) {
        throw new Error("No strain data returned from Supabase or API");
      }
      setStrains(allData);
      setAllStrainsLoaded(true);
      setHasMore(false);
    } catch (error) {
      console.error("❌ Error fetching strains:", error);
      setStrains([]);
    } finally {
      setLoading(false);
    }
  }, [fetchStrainsFromApi, fetchStrainsFromSupabase, supabase]);
  reactExports.useEffect(() => {
    fetchAllStrains();
  }, [fetchAllStrains]);
  const sortStrains = reactExports.useCallback((strainsToSort) => {
    const sorted = [...strainsToSort];
    const typeOrder = { "indica": 1, "sativa": 2, "hybrid": 3 };
    switch (sortBy) {
      case "type": {
        return sorted.sort((a, b) => {
          const aType = (a.type || "unknown").toLowerCase();
          const bType = (b.type || "unknown").toLowerCase();
          const aOrder = typeOrder[aType] || 4;
          const bOrder = typeOrder[bType] || 4;
          if (aOrder !== bOrder) return aOrder - bOrder;
          return (a.name || "").localeCompare(b.name || "");
        });
      }
      case "name":
        return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      case "thc":
        return sorted.sort((a, b) => (parseFloat(b.thc) || 0) - (parseFloat(a.thc) || 0));
      case "rating":
        return sorted.sort((a, b) => (a.name || "").localeCompare(b.name || ""));
      default:
        return sorted;
    }
  }, [sortBy]);
  const applyThcFilter = reactExports.useCallback((strainsToFilter) => {
    return strainsToFilter.filter((strain) => {
      const thc = parseFloat(strain.thc) || 0;
      return thc >= thcRange[0] && thc <= thcRange[1];
    });
  }, [thcRange]);
  const filterStrains = reactExports.useCallback(() => {
    setShowingFavorites(false);
    let filtered = [...strains];
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (s) => s.name?.toLowerCase().includes(query) || s.description?.toLowerCase().includes(query) || s.effects?.some((e) => e.toLowerCase().includes(query)) || s.flavors?.some((f) => f.toLowerCase().includes(query))
      );
    }
    if (typeFilter !== "all") {
      filtered = filtered.filter((s) => s.type?.toLowerCase() === typeFilter);
    }
    if (showFilters) {
      filtered = applyThcFilter(filtered);
    } else {
      filtered = filtered.filter((s) => {
        const thcValue = s.thc ?? 0;
        return thcValue >= thcRange[0] && thcValue <= thcRange[1];
      });
    }
    filtered = sortStrains(filtered);
    setFilteredStrains(filtered);
  }, [strains, searchQuery, typeFilter, showFilters, thcRange, sortStrains, applyThcFilter]);
  reactExports.useEffect(() => {
    filterStrains();
  }, [filterStrains]);
  const visibleStrains = reactExports.useMemo(
    () => Array.isArray(displayedStrains) ? displayedStrains.slice(0, maxToShow) : [],
    [displayedStrains, maxToShow]
  );
  reactExports.useEffect(() => {
    setDisplayedStrains(filteredStrains.slice(0, STRAINS_PER_PAGE));
    setPage(0);
    setHasMore(filteredStrains.length > STRAINS_PER_PAGE);
    setMaxToShow(300);
  }, [filteredStrains]);
  reactExports.useEffect(() => {
    const loadMoreDisplayedStrains = /* @__PURE__ */ __name(() => {
      const nextPage = page + 1;
      const start = nextPage * STRAINS_PER_PAGE;
      const end = start + STRAINS_PER_PAGE;
      const moreStrains = filteredStrains.slice(start, end);
      if (moreStrains.length > 0) {
        setDisplayedStrains((prev) => [...prev, ...moreStrains]);
        setPage(nextPage);
      }
      const hasMoreToDisplay = end < filteredStrains.length;
      setHasMore(hasMoreToDisplay);
    }, "loadMoreDisplayedStrains");
    const currentTarget = observerTarget.current;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loading) {
          loadMoreDisplayedStrains();
        }
      },
      { threshold: 0.1 }
    );
    if (currentTarget) {
      observer.observe(currentTarget);
    }
    return () => {
      if (currentTarget) {
        observer.unobserve(currentTarget);
      }
    };
  }, [hasMore, loading, page, filteredStrains]);
  const handleStrainClick = /* @__PURE__ */ __name(async (strain) => {
    setSelectedStrain(strain);
    setDetailsOpen(true);
    setDetailsTab(0);
    fetchVendorsForStrain(strain.name);
    fetchDispensariesForStrain();
    fetchReviewsForStrain(strain.slug, strain);
  }, "handleStrainClick");
  const fetchVendorsForStrain = /* @__PURE__ */ __name(async (strainName) => {
    try {
      const apiBase = API_BASE || "http://localhost:5181";
      const response = await fetch(`${apiBase}/api/seeds-live?strain=${encodeURIComponent(strainName)}&limit=20`);
      const data = await response.json();
      const transformedVendors = (data.results || []).map((vendor) => ({
        seed_vendors: {
          name: vendor.name,
          website: vendor.website,
          country: vendor.country,
          rating: vendor.rating || 0,
          verified: vendor.verified || false
        },
        price: vendor.price || "N/A",
        seed_count: vendor.seed_count || 10,
        url: vendor.website,
        in_stock: vendor.in_stock !== false
      }));
      setVendors(transformedVendors);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      setVendors([]);
    }
  }, "fetchVendorsForStrain");
  const fetchDispensariesForStrain = /* @__PURE__ */ __name(async () => {
    try {
      if (!userLocation) {
        setDispensaries([]);
        return;
      }
      const apiBase = API_BASE || "http://localhost:5181";
      const response = await fetch(
        `${apiBase}/api/dispensaries-live?lat=${userLocation.lat}&lng=${userLocation.lng}&radius=100&limit=20`
      );
      const data = await response.json();
      const transformedDispensaries = (data.results || []).map((disp) => ({
        dispensaries: {
          name: disp.name,
          city: disp.city || disp.address?.split(",")[1]?.trim() || "Unknown",
          state: disp.state || disp.address?.split(",")[2]?.trim() || "",
          rating: disp.rating || 0,
          verified: disp.verified || false,
          website: disp.website || null
        },
        price_per_eighth: disp.price_per_eighth || "N/A",
        price_per_ounce: disp.price_per_ounce || "N/A",
        distance: disp.distance,
        in_stock: true
      }));
      setDispensaries(transformedDispensaries);
    } catch (error) {
      console.error("Error fetching dispensaries:", error);
      setDispensaries([]);
    }
  }, "fetchDispensariesForStrain");
  const fetchReviewsForStrain = /* @__PURE__ */ __name(async (strainSlug, strainForFallback) => {
    try {
      if (supabase) {
        const { data, error } = await supabase.from("reviews").select("*").eq("strain_slug", strainSlug).order("created_at", { ascending: false }).limit(10);
        if (error) throw error;
        if (data && data.length) {
          setReviews(data);
          return;
        }
      }
      const res = await fetch(`${API_BASE}/api/strains/${strainSlug}/reviews`);
      if (res.ok) {
        const payload = await res.json().catch(() => ({}));
        const reviewList = Array.isArray(payload?.reviews) ? payload.reviews : [];
        setReviews(reviewList);
        return;
      }
      throw new Error(`HTTP ${res.status} when fetching reviews`);
    } catch (error) {
      console.error("Error fetching reviews:", error);
      const fallbackReviews = strainForFallback?.reviews;
      setReviews(Array.isArray(fallbackReviews) ? fallbackReviews : []);
    }
  }, "fetchReviewsForStrain");
  const getTypeColor = /* @__PURE__ */ __name((type) => {
    switch (type?.toLowerCase()) {
      case "indica":
        return "#9c27b0";
      case "sativa":
        return "#ff9800";
      case "hybrid":
        return "#4caf50";
      default:
        return "#757575";
    }
  }, "getTypeColor");
  reactExports.useEffect(() => {
    const savedFavorites = localStorage.getItem("strainFavorites");
    if (savedFavorites) {
      try {
        setFavorites(JSON.parse(savedFavorites));
      } catch (e) {
        console.error("Error loading favorites:", e);
      }
    }
  }, []);
  reactExports.useEffect(() => {
    localStorage.setItem("strainFavorites", JSON.stringify(favorites));
  }, [favorites]);
  const toggleFavorite = /* @__PURE__ */ __name((strainSlug) => {
    setFavorites((prev) => {
      const isFavorite = prev.includes(strainSlug);
      if (isFavorite) {
        setSnackbar({ open: true, message: "Removed from favorites", severity: "info" });
        return prev.filter((s) => s !== strainSlug);
      } else {
        setSnackbar({ open: true, message: "Added to favorites! ⭐", severity: "success" });
        return [...prev, strainSlug];
      }
    });
  }, "toggleFavorite");
  const renderDetailsTab = /* @__PURE__ */ __name(() => {
    if (!selectedStrain) return null;
    switch (detailsTab) {
      case 0:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: { color: "#fff", mb: 2 }, children: selectedStrain.description || "No description available" }),
          selectedStrain.effects && selectedStrain.effects.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { color: "#7cb342", fontWeight: 700, mb: 1 }, children: "Effects:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: selectedStrain.effects.map((effect, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: effect, size: "small", sx: { bgcolor: "rgba(124, 179, 66, 0.3)", color: "#fff", mb: 1 } }, idx)) })
          ] }),
          selectedStrain.flavors && selectedStrain.flavors.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mb: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { color: "#7cb342", fontWeight: 700, mb: 1 }, children: "Flavors:" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { direction: "row", spacing: 1, flexWrap: "wrap", children: selectedStrain.flavors.map((flavor, idx) => /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: flavor, size: "small", sx: { bgcolor: "rgba(255, 152, 0, 0.3)", color: "#fff", mb: 1 } }, idx)) })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 2, sx: { mt: 2 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 2, bgcolor: "rgba(124, 179, 66, 0.15)", borderRadius: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: "Type" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { color: "#fff", textTransform: "capitalize" }, children: selectedStrain.type || "Unknown" })
            ] }) }),
            selectedStrain.thc && /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 2, bgcolor: "rgba(124, 179, 66, 0.2)", borderRadius: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: "THC" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h5", sx: { color: "#7cb342", fontWeight: 700 }, children: [
                selectedStrain.thc,
                "%"
              ] })
            ] }) }),
            selectedStrain.cbd && /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 6, sm: 3, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 2, bgcolor: "rgba(33, 150, 243, 0.2)", borderRadius: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: "CBD" }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "h5", sx: { color: "#2196f3", fontWeight: 700 }, children: [
                selectedStrain.cbd,
                "%"
              ] })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: selectedStrain.cbd ? 3 : 6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 2, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: "Common effects" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff" }, children: selectedStrain.effects?.slice(0, 3).join(", ") || "—" })
            ] }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 2, bgcolor: "rgba(255,255,255,0.08)", borderRadius: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0" }, children: "Flavors" }),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff" }, children: selectedStrain.flavors?.slice(0, 3).join(", ") || "—" })
            ] }) })
          ] })
        ] });
      case 1:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, sx: { mb: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(
            Button,
            {
              variant: "contained",
              size: "small",
              startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchIcon, {}),
              onClick: /* @__PURE__ */ __name(() => {
                setShowSeedFinder(true);
                setDetailsOpen(false);
              }, "onClick"),
              sx: {
                bgcolor: "rgba(124, 179, 66, 0.3)",
                color: "#fff",
                border: "1px solid rgba(124, 179, 66, 0.6)",
                backdropFilter: "blur(10px)",
                "&:hover": {
                  bgcolor: "rgba(124, 179, 66, 0.5)",
                  border: "1px solid rgba(124, 179, 66, 0.8)"
                }
              },
              children: [
                "Search All Seed Banks for ",
                selectedStrain?.name
              ]
            }
          ) }),
          vendors.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { textAlign: "center", py: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#e0e0e0" }, children: "No seed vendors found for this strain" }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#aaa" }, children: "Click the button above to search all seed banks" })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(List, { children: vendors.map((v, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItem, { sx: { bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, mb: 2, border: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemIcon, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(LocalFloristIcon, { sx: { color: "#7cb342" } }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ListItemText,
              {
                primary: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#fff", fontWeight: 600 }, children: v.seed_vendors?.name }),
                  v.seed_vendors?.verified && /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedIcon, { sx: { fontSize: 16, color: "#2196f3" } })
                ] }),
                secondary: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 0.5, sx: { mt: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AttachMoneyIcon, { sx: { fontSize: 14, verticalAlign: "middle", mr: 0.5 } }),
                    "$",
                    v.price,
                    " for ",
                    v.seed_count,
                    " seeds"
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#aaa" }, children: [
                    v.seed_vendors?.country,
                    " • Rating: ",
                    v.seed_vendors?.rating,
                    "/5"
                  ] }),
                  v.url && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", href: v.url, target: "_blank", sx: { mt: 1, color: "#7cb342" }, children: "Visit Store →" })
                ] })
              }
            )
          ] }, idx)) })
        ] });
      case 2:
        return /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { children: [
          /* @__PURE__ */ jsxRuntimeExports.jsx(Alert, { severity: "info", sx: { mb: 2, bgcolor: "rgba(33, 150, 243, 0.1)", color: "#90caf9", border: "1px solid rgba(33, 150, 243, 0.3)" }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", children: [
            "Showing dispensaries within 100 miles of your location. Call ahead to confirm ",
            selectedStrain?.name,
            " is in stock."
          ] }) }),
          dispensaries.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 2, sx: { textAlign: "center", py: 4 }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#e0e0e0" }, children: loadingLocation ? "Detecting your location..." : "No dispensaries found within 100 miles" }),
            userLocation && /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#aaa" }, children: [
              "Searching near: ",
              userLocation.lat.toFixed(4),
              ", ",
              userLocation.lng.toFixed(4)
            ] })
          ] }) : /* @__PURE__ */ jsxRuntimeExports.jsx(List, { children: dispensaries.map((d, idx) => /* @__PURE__ */ jsxRuntimeExports.jsxs(ListItem, { sx: { bgcolor: "rgba(255,255,255,0.05)", borderRadius: 2, mb: 2, border: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsx(ListItemIcon, { children: /* @__PURE__ */ jsxRuntimeExports.jsx(StoreIcon, { sx: { color: "#7cb342" } }) }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(
              ListItemText,
              {
                primary: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#fff", fontWeight: 600 }, children: d.dispensaries?.name }),
                  d.dispensaries?.verified && /* @__PURE__ */ jsxRuntimeExports.jsx(VerifiedIcon, { sx: { fontSize: 16, color: "#2196f3" } })
                ] }),
                secondary: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { spacing: 0.5, sx: { mt: 1 }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(LocationOn, { sx: { fontSize: 14, verticalAlign: "middle", mr: 0.5 } }),
                    d.dispensaries?.city,
                    ", ",
                    d.dispensaries?.state,
                    d.distance && /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: `${d.distance.toFixed(1)} mi`, size: "small", sx: { ml: 1, height: 18, fontSize: "0.65rem", bgcolor: "rgba(124, 179, 66, 0.2)", color: "#7cb342" } })
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(AttachMoneyIcon, { sx: { fontSize: 14, verticalAlign: "middle", mr: 0.5 } }),
                    d.price_per_eighth !== "N/A" ? `$${d.price_per_eighth}/eighth` : "Price varies",
                    d.price_per_ounce !== "N/A" && ` • $${d.price_per_ounce}/oz`
                  ] }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#aaa" }, children: [
                    "Rating: ",
                    d.dispensaries?.rating,
                    "/5"
                  ] }),
                  d.dispensaries?.website && /* @__PURE__ */ jsxRuntimeExports.jsx(Button, { size: "small", href: d.dispensaries.website, target: "_blank", sx: { mt: 1, color: "#7cb342" }, children: "Visit Website →" })
                ] })
              }
            )
          ] }, idx)) })
        ] });
      case 3:
        return /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { children: reviews.length === 0 ? /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { sx: { color: "#e0e0e0", textAlign: "center", py: 4 }, children: "No reviews yet for this strain" }) : /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 2, children: reviews.map((review) => /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 2, bgcolor: "rgba(255,255,255,0.05)", border: "1px solid rgba(124, 179, 66, 0.3)", borderRadius: 2 }, children: [
          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", mb: 1, children: [
            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "subtitle2", sx: { color: "#7cb342", fontWeight: 600 }, children: [
              "Rating: ",
              review.rating,
              "/5"
            ] }),
            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#aaa" }, children: new Date(review.created_at).toLocaleDateString() })
          ] }),
          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#fff" }, children: review.comment })
        ] }, review.id)) }) });
      default:
        return null;
    }
  }, "renderDetailsTab");
  if (showSeedFinder) {
    return /* @__PURE__ */ jsxRuntimeExports.jsx(
      SeedVendorFinder,
      {
        onBack: /* @__PURE__ */ __name(() => {
          setShowSeedFinder(false);
          setDetailsOpen(true);
        }, "onBack")
      }
    );
  }
  const handleBack = /* @__PURE__ */ __name(() => {
    if (onBack) {
      onBack();
    } else {
      if (window.history.length > 1) {
        window.history.back();
      }
    }
  }, "handleBack");
  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
    Box,
    {
      sx: {
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
        // Important so only the inner area scrolls
        pt: "env(safe-area-inset-top)"
        // Account for iOS safe area
      },
      children: [
        /* @__PURE__ */ jsxRuntimeExports.jsxs(
          Box,
          {
            sx: {
              flexShrink: 0,
              display: "flex",
              alignItems: "center",
              p: 2,
              gap: 1.5,
              borderBottom: "1px solid rgba(255,255,255,0.08)",
              bgcolor: "transparent",
              backdropFilter: "blur(10px)",
              zIndex: 1
            },
            children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                IconButton,
                {
                  edge: "start",
                  onClick: handleBack,
                  sx: { color: "#fff" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(ArrowBackIcon, {})
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h6", sx: { fontWeight: 600, color: "#fff", flex: 1 }, children: "Strain Browser" })
            ]
          }
        ),
        /* @__PURE__ */ jsxRuntimeExports.jsx(
          Box,
          {
            sx: {
              flex: 1,
              minHeight: 0,
              // CRITICAL for flex scrolling
              overflowY: "auto",
              WebkitOverflowScrolling: "touch"
              // iOS momentum scroll
            },
            children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Container, { maxWidth: "md", sx: { py: 2 }, children: [
              /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", mb: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                Box,
                {
                  sx: {
                    width: { xs: 80, sm: 100 },
                    height: { xs: 80, sm: 100 },
                    borderRadius: "50%",
                    background: "transparent",
                    border: "2px solid rgba(124, 179, 66, 0.5)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    boxShadow: "0 0 30px rgba(124, 179, 66, 0.5)",
                    overflow: "hidden",
                    animation: "pulse 3s ease-in-out infinite",
                    "@keyframes pulse": {
                      "0%": { boxShadow: "0 0 20px rgba(124, 179, 66, 0.4)" },
                      "50%": { boxShadow: "0 0 40px rgba(124, 179, 66, 0.7)" },
                      "100%": { boxShadow: "0 0 20px rgba(124, 179, 66, 0.4)" }
                    }
                  },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    "img",
                    {
                      src: "/hero.png?v=13",
                      alt: "StrainSpotter",
                      style: { width: "100%", height: "100%", objectFit: "cover" }
                    }
                  )
                }
              ) }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", justifyContent: "center", spacing: 1, sx: { mb: 2 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: "/hero.png?v=13", alt: "", sx: { width: 24, height: 24, borderRadius: "50%", filter: "drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))" } }),
                /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { color: "#fff", fontWeight: 700 }, children: "Strain Browser" })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(Paper, { sx: { p: 2, mb: 2, background: "rgba(255,255,255,0.1)", backdropFilter: "blur(20px)", border: "1px solid rgba(124, 179, 66, 0.3)", borderRadius: 2 }, children: [
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Grid, { container: true, spacing: 1.5, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, md: 6, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    TextField,
                    {
                      fullWidth: true,
                      size: "small",
                      placeholder: "Search strains by name, effects, flavors...",
                      value: searchQuery,
                      onChange: /* @__PURE__ */ __name((e) => setSearchQuery(e.target.value), "onChange"),
                      onKeyPress: /* @__PURE__ */ __name((e) => {
                        if (e.key === "Enter") {
                          filterStrains();
                        }
                      }, "onKeyPress"),
                      slotProps: {
                        input: {
                          startAdornment: /* @__PURE__ */ jsxRuntimeExports.jsx(InputAdornment, { position: "start", children: /* @__PURE__ */ jsxRuntimeExports.jsx(SearchIcon, { sx: { color: "#7cb342", fontSize: 20 } }) }),
                          endAdornment: searchQuery && /* @__PURE__ */ jsxRuntimeExports.jsx(InputAdornment, { position: "end", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                            IconButton,
                            {
                              size: "small",
                              onClick: /* @__PURE__ */ __name(() => setSearchQuery(""), "onClick"),
                              sx: { color: "#fff", padding: "4px" },
                              children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, { sx: { fontSize: 18 } })
                            }
                          ) }),
                          sx: { color: "#fff", fontSize: "0.875rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.8)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#7cb342" } }
                        }
                      }
                    }
                  ) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { fullWidth: true, size: "small", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(InputLabel, { sx: { color: "#fff", fontSize: "0.875rem" }, children: "Type" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: typeFilter, onChange: /* @__PURE__ */ __name((e) => setTypeFilter(e.target.value), "onChange"), label: "Type", sx: { color: "#fff", fontSize: "0.875rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.8)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#7cb342" } }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "all", children: "All" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "indica", children: "Indica" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "sativa", children: "Sativa" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "hybrid", children: "Hybrid" })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 6, sm: 4, md: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(FormControl, { fullWidth: true, size: "small", children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(InputLabel, { sx: { color: "#fff", fontSize: "0.875rem" }, children: "Sort" }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Select, { value: sortBy, onChange: /* @__PURE__ */ __name((e) => setSortBy(e.target.value), "onChange"), label: "Sort", sx: { color: "#fff", fontSize: "0.875rem", "& .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.5)" }, "&:hover .MuiOutlinedInput-notchedOutline": { borderColor: "rgba(124, 179, 66, 0.8)" }, "&.Mui-focused .MuiOutlinedInput-notchedOutline": { borderColor: "#7cb342" } }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "type", children: "Type (I→S→H)" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "name", children: "Name" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "thc", children: "THC %" }),
                      /* @__PURE__ */ jsxRuntimeExports.jsx(MenuItem, { value: "rating", children: "Rating" })
                    ] })
                  ] }) }),
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Grid, { item: true, xs: 12, sm: 4, md: 2, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      fullWidth: true,
                      size: "small",
                      variant: showFilters ? "contained" : "outlined",
                      onClick: /* @__PURE__ */ __name(() => setShowFilters(!showFilters), "onClick"),
                      startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(FilterListIcon, { fontSize: "small" }),
                      sx: {
                        color: showFilters ? "#000" : "#fff",
                        bgcolor: showFilters ? "#7cb342" : "transparent",
                        borderColor: "rgba(124, 179, 66, 0.6)",
                        fontSize: "0.875rem",
                        "&:hover": {
                          borderColor: "rgba(124, 179, 66, 1)",
                          bgcolor: showFilters ? "#7cb342" : "rgba(124, 179, 66, 0.1)"
                        }
                      },
                      children: "Filters"
                    }
                  ) })
                ] }),
                showFilters && /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { mt: 3, p: 2, background: "rgba(124, 179, 66, 0.1)", borderRadius: 2, border: "1px solid rgba(124, 179, 66, 0.3)" }, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "subtitle2", sx: { color: "#7cb342", fontWeight: 700, mb: 2 }, children: "Advanced Filters" }),
                  /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { px: 2 }, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#fff", mb: 1 }, children: [
                      "THC Range: ",
                      thcRange[0],
                      "% - ",
                      thcRange[1],
                      "%"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(
                      Slider,
                      {
                        value: thcRange,
                        onChange: /* @__PURE__ */ __name((e, newValue) => setThcRange(newValue), "onChange"),
                        valueLabelDisplay: "auto",
                        min: 0,
                        max: 35,
                        sx: {
                          color: "#7cb342",
                          "& .MuiSlider-thumb": {
                            bgcolor: "#7cb342"
                          },
                          "& .MuiSlider-track": {
                            bgcolor: "#7cb342"
                          },
                          "& .MuiSlider-rail": {
                            bgcolor: "rgba(124, 179, 66, 0.3)"
                          }
                        }
                      }
                    )
                  ] })
                ] }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", mt: 2, children: [
                  /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#e0e0e0", fontSize: "0.8rem" }, children: loading ? "Loading strains..." : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    "Showing ",
                    displayedStrains.length,
                    " of ",
                    filteredStrains.length,
                    " strains",
                    filteredStrains.length < strains.length && ` (filtered from ${strains.length} total)`,
                    !allStrainsLoaded && " - Loading all strains..."
                  ] }) }),
                  showingFavorites && /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Button,
                    {
                      size: "small",
                      variant: "text",
                      onClick: /* @__PURE__ */ __name(() => {
                        setShowingFavorites(false);
                        filterStrains();
                      }, "onClick"),
                      sx: { color: "#7cb342" },
                      children: "Show all strains"
                    }
                  ),
                  favorites.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Tooltip, { title: "View favorites", children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Chip,
                    {
                      size: "small",
                      icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FavoriteIcon, { sx: { fontSize: 16 } }),
                      label: `${favorites.length}`,
                      onClick: /* @__PURE__ */ __name(() => {
                        if (favorites.length === 0) {
                          setSnackbar({ open: true, message: "No favorites yet. Tap the heart on any strain to save it.", severity: "warning" });
                          return;
                        }
                        setSearchQuery("");
                        setTypeFilter("all");
                        const favStrains = strains.filter((s) => favorites.includes(s.slug));
                        setFilteredStrains(favStrains);
                        setDisplayedStrains(favStrains.slice(0, STRAINS_PER_PAGE));
                        setHasMore(false);
                        setShowingFavorites(true);
                        setSnackbar({ open: true, message: "Showing favorites only", severity: "info" });
                      }, "onClick"),
                      sx: {
                        bgcolor: "rgba(255, 64, 129, 0.2)",
                        color: "#ff4081",
                        cursor: "pointer",
                        fontSize: "0.75rem",
                        height: 24,
                        "&:hover": { bgcolor: "rgba(255, 64, 129, 0.3)" }
                      }
                    }
                  ) })
                ] })
              ] }),
              !loading && favorites.length === 0 && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { mb: 3 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                EmptyStateCard,
                {
                  title: "No favorites yet",
                  description: "Tap the heart icon on any strain to pin it here for quick access.",
                  icon: /* @__PURE__ */ jsxRuntimeExports.jsx(FavoriteBorderIcon, { sx: { fontSize: 48, color: "#ff4081" } })
                }
              ) }),
              loading ? /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { display: "flex", justifyContent: "center", py: 8 }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { sx: { color: "#7cb342" } }) }) : /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                /* @__PURE__ */ jsxRuntimeExports.jsx(Stack, { spacing: 1, children: visibleStrains.map((strain) => {
                  const indicaPercent = strain.type === "indica" ? 100 : strain.type === "sativa" ? 0 : 50;
                  const sativaPercent = 100 - indicaPercent;
                  const typeColor = strain.type === "indica" ? "#7b1fa2" : strain.type === "sativa" ? "#f57c00" : "#00897b";
                  const strainNumber = filteredStrains.findIndex((s) => s.slug === strain.slug) + 1;
                  return /* @__PURE__ */ jsxRuntimeExports.jsxs(
                    Paper,
                    {
                      onClick: /* @__PURE__ */ __name(() => handleStrainClick(strain), "onClick"),
                      sx: {
                        p: 1.5,
                        cursor: "pointer",
                        background: "rgba(255,255,255,0.1)",
                        backdropFilter: "blur(20px)",
                        border: `2px solid ${typeColor}40`,
                        borderRadius: 2,
                        transition: "all 0.2s ease",
                        "&:hover": {
                          transform: "translateX(4px)",
                          border: `2px solid ${typeColor}`,
                          boxShadow: `0 4px 16px ${typeColor}40`
                        }
                      },
                      children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Box,
                          {
                            sx: {
                              width: "100%",
                              aspectRatio: "16/9",
                              overflow: "hidden",
                              borderRadius: 1,
                              mb: 1,
                              bgcolor: "transparent",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              minHeight: 120,
                              position: "relative"
                            },
                            children: /* @__PURE__ */ jsxRuntimeExports.jsx(StrainImageCard, { strain })
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: {
                            color: "#7cb342",
                            fontWeight: 700,
                            fontSize: "0.7rem",
                            minWidth: 32,
                            textAlign: "right",
                            opacity: 0.7
                          }, children: [
                            "#",
                            strainNumber
                          ] }),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            IconButton,
                            {
                              size: "small",
                              onClick: /* @__PURE__ */ __name((e) => {
                                e.stopPropagation();
                                toggleFavorite(strain.slug);
                              }, "onClick"),
                              sx: {
                                color: favorites.includes(strain.slug) ? "#ff4081" : "#666",
                                padding: "2px",
                                "&:hover": {
                                  color: "#ff4081",
                                  transform: "scale(1.2)"
                                }
                              },
                              children: favorites.includes(strain.slug) ? /* @__PURE__ */ jsxRuntimeExports.jsx(FavoriteIcon, { sx: { fontSize: 18 } }) : /* @__PURE__ */ jsxRuntimeExports.jsx(FavoriteBorderIcon, { sx: { fontSize: 18 } })
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body1", sx: {
                            color: "#fff",
                            fontWeight: 700,
                            flex: 1,
                            fontSize: "0.85rem",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap"
                          }, children: strain.name }),
                          /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 0.3, sx: { minWidth: 55, flexShrink: 0 }, children: [
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#7b1fa2", fontWeight: 600, fontSize: "0.65rem" }, children: [
                              "I",
                              indicaPercent
                            ] }),
                            /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "caption", sx: { color: "#666", fontSize: "0.65rem" }, children: "|" }),
                            /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "caption", sx: { color: "#f57c00", fontWeight: 600, fontSize: "0.65rem" }, children: [
                              "S",
                              sativaPercent
                            ] })
                          ] }),
                          strain.thc && /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Chip,
                            {
                              label: `${strain.thc}%`,
                              size: "small",
                              sx: {
                                bgcolor: "#7cb342",
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.65rem",
                                height: 20,
                                minWidth: 40,
                                flexShrink: 0,
                                "& .MuiChip-label": { px: 0.5 }
                              }
                            }
                          ),
                          /* @__PURE__ */ jsxRuntimeExports.jsx(
                            Chip,
                            {
                              label: strain.type || "Unk",
                              size: "small",
                              sx: {
                                bgcolor: typeColor,
                                color: "#fff",
                                fontWeight: 700,
                                fontSize: "0.65rem",
                                height: 20,
                                minWidth: 45,
                                flexShrink: 0,
                                textTransform: "capitalize",
                                "& .MuiChip-label": { px: 0.5 }
                              }
                            }
                          )
                        ] })
                      ]
                    },
                    strain.slug
                  );
                }) }),
                Array.isArray(displayedStrains) && displayedStrains.length > maxToShow && /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { sx: { textAlign: "center", padding: "16px 0" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                  Button,
                  {
                    type: "button",
                    onClick: /* @__PURE__ */ __name(() => setMaxToShow((prev) => prev + 300), "onClick"),
                    variant: "contained",
                    sx: {
                      padding: "10px 18px",
                      borderRadius: 999,
                      fontWeight: 600,
                      fontSize: 14,
                      bgcolor: "#7cb342",
                      "&:hover": { bgcolor: "#689f38" }
                    },
                    children: "Load 300 more strains"
                  }
                ) }),
                /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { ref: observerTarget, sx: { py: 4, display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }, children: [
                  hasMore && displayedStrains.length > 0 && /* @__PURE__ */ jsxRuntimeExports.jsxs(jsxRuntimeExports.Fragment, { children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(CircularProgress, { size: 30, sx: { color: "#7cb342" } }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "body2", sx: { color: "#7cb342", fontWeight: 600 }, children: "Loading more strains..." })
                  ] }),
                  !hasMore && displayedStrains.length > 0 && displayedStrains.length === filteredStrains.length && /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", alignItems: "center", spacing: 1, children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(Typography, { variant: "body2", sx: { color: "#e0e0e0" }, children: [
                      "All ",
                      filteredStrains.length,
                      " strains displayed!"
                    ] }),
                    /* @__PURE__ */ jsxRuntimeExports.jsx(Box, { component: "img", src: "/hero.png?v=13", alt: "", sx: { width: 16, height: 16, borderRadius: "50%", filter: "drop-shadow(0 0 4px rgba(124, 179, 66, 0.6))" } })
                  ] })
                ] })
              ] }),
              /* @__PURE__ */ jsxRuntimeExports.jsxs(
                Dialog,
                {
                  open: detailsOpen,
                  onClose: /* @__PURE__ */ __name(() => setDetailsOpen(false), "onClose"),
                  maxWidth: "md",
                  fullWidth: true,
                  fullScreen: true,
                  slotProps: {
                    paper: {
                      sx: {
                        background: "linear-gradient(135deg, rgba(30, 30, 30, 0.98) 0%, rgba(20, 20, 20, 0.98) 100%)",
                        backdropFilter: "blur(20px)",
                        border: "2px solid rgba(124, 179, 66, 0.3)",
                        borderRadius: { xs: 0, sm: 4 },
                        m: 0,
                        maxHeight: "100vh"
                      }
                    }
                  },
                  children: [
                    /* @__PURE__ */ jsxRuntimeExports.jsx(DialogTitle, { sx: {
                      color: "#fff",
                      fontWeight: 700,
                      borderBottom: "1px solid rgba(124, 179, 66, 0.3)",
                      pt: "calc(env(safe-area-inset-top) + 16px)"
                    }, children: /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", justifyContent: "space-between", alignItems: "center", spacing: 2, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Box, { sx: { flex: 1 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Typography, { variant: "h5", sx: { fontWeight: 700, fontSize: { xs: "1.25rem", sm: "1.5rem" } }, children: selectedStrain?.name }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Chip, { label: selectedStrain?.type || "Unknown", size: "small", sx: { bgcolor: getTypeColor(selectedStrain?.type), color: "#fff", fontWeight: 600, mt: 1 } })
                      ] }),
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Stack, { direction: "row", spacing: 1, alignItems: "center", children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            size: "small",
                            variant: "contained",
                            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(NoteAltIcon, {}),
                            onClick: /* @__PURE__ */ __name(() => handleLogExperience(selectedStrain), "onClick"),
                            children: "Log experience"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(
                          Button,
                          {
                            size: "small",
                            variant: "outlined",
                            startIcon: /* @__PURE__ */ jsxRuntimeExports.jsx(LibraryBooksIcon, {}),
                            onClick: /* @__PURE__ */ __name(() => {
                              setDetailsOpen(false);
                              window.dispatchEvent(new CustomEvent("nav:set-view", { detail: "grow-coach" }));
                            }, "onClick"),
                            sx: { color: "#fff", borderColor: "rgba(255,255,255,0.3)" },
                            children: "Grow log"
                          }
                        ),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(IconButton, { onClick: /* @__PURE__ */ __name(() => setDetailsOpen(false), "onClick"), sx: { color: "#fff" }, children: /* @__PURE__ */ jsxRuntimeExports.jsx(CloseIcon, {}) })
                      ] })
                    ] }) }),
                    /* @__PURE__ */ jsxRuntimeExports.jsxs(DialogContent, { sx: { pt: 2 }, children: [
                      /* @__PURE__ */ jsxRuntimeExports.jsxs(Tabs, { value: detailsTab, onChange: /* @__PURE__ */ __name((e, v) => setDetailsTab(v), "onChange"), sx: { borderBottom: "1px solid rgba(124, 179, 66, 0.3)", mb: 3 }, children: [
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: "Overview", sx: { color: "#fff", "&.Mui-selected": { color: "#7cb342" } } }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: `Seed Vendors (${vendors.length})`, sx: { color: "#fff", "&.Mui-selected": { color: "#7cb342" } } }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: `Dispensaries (${dispensaries.length})`, sx: { color: "#fff", "&.Mui-selected": { color: "#7cb342" } } }),
                        /* @__PURE__ */ jsxRuntimeExports.jsx(Tab, { label: `Reviews (${reviews.length})`, sx: { color: "#fff", "&.Mui-selected": { color: "#7cb342" } } })
                      ] }),
                      renderDetailsTab()
                    ] })
                  ]
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                Snackbar,
                {
                  open: snackbar.open,
                  autoHideDuration: 3e3,
                  onClose: /* @__PURE__ */ __name(() => setSnackbar({ ...snackbar, open: false }), "onClose"),
                  anchorOrigin: { vertical: "bottom", horizontal: "center" },
                  children: /* @__PURE__ */ jsxRuntimeExports.jsx(
                    Alert,
                    {
                      onClose: /* @__PURE__ */ __name(() => setSnackbar({ ...snackbar, open: false }), "onClose"),
                      severity: snackbar.severity,
                      sx: { width: "100%" },
                      children: snackbar.message
                    }
                  )
                }
              ),
              /* @__PURE__ */ jsxRuntimeExports.jsx(
                JournalDialog,
                {
                  open: journalDialogOpen,
                  defaults: journalDefaults,
                  onClose: /* @__PURE__ */ __name(() => setJournalDialogOpen(false), "onClose"),
                  onSaved: /* @__PURE__ */ __name(() => {
                    setJournalDialogOpen(false);
                    setSnackbar({ open: true, message: "Journal entry saved.", severity: "success" });
                  }, "onSaved")
                }
              )
            ] })
          }
        )
      ]
    }
  );
}
__name(StrainBrowser, "StrainBrowser");
export {
  StrainBrowser as default
};
