import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import "./Tours.css";
import TourCard from "../components/TourCard";
import SearchBar from "../components/SearchBar";
import { tours as mockTours } from "../data/mockData";
import { getTours } from "../services/api";

export default function Tours() {
  const [searchParams] = useSearchParams();
  const initialSearch = searchParams.get("search") || searchParams.get("destination") || "";
  const [toursList, setToursList] = useState(mockTours);
  const [query, setQuery] = useState(initialSearch);
  const [category, setCategory] = useState("All");
  const [maxPrice, setMaxPrice] = useState(50000);
  const [sort, setSort] = useState("featured");

  useEffect(() => {
    const s = searchParams.get("search") || searchParams.get("destination");
    if (s !== null) {
      setQuery(s);
    }
  }, [searchParams]);

  useEffect(() => {
    let isMounted = true;
    getTours().then(data => {
      const list = Array.isArray(data) ? data : (data?.tours || []);
      if (isMounted && list.length > 0) {
        setToursList(list);
      }
    }).catch(() => {});
    return () => { isMounted = false; };
  }, []);

  const filtered = useMemo(() => {
    let data = toursList.filter(t => `${t.title} ${t.destination} ${t.category}`.toLowerCase().includes(query.toLowerCase()) && (category === "All" || t.category === category) && (t.price || 0) <= maxPrice);
    if (sort === "price-low") data = [...data].sort((a,b)=>a.price-b.price);
    if (sort === "price-high") data = [...data].sort((a,b)=>b.price-a.price);
    if (sort === "rating") data = [...data].sort((a,b)=>b.rating-a.rating);
    return data;
  }, [toursList, query, category, maxPrice, sort]);

  return <div className="page"><div className="container page-title-wrap"><span className="eyebrow">Curated experiences</span><h1 className="display-title">Find a trip worth remembering.</h1><p className="muted">Search destinations, compare packages and choose the experience that fits your style.</p></div>
    <section className="container tours-layout">
      <aside className="filter-panel card"><h3>Refine your search</h3><div className="field"><label>Search</label><SearchBar value={query} onChange={setQuery}/></div><div className="field"><label>Category</label><select value={category} onChange={e=>setCategory(e.target.value)}><option>All</option><option>Beach</option><option>Nature</option><option>Adventure</option><option>Mountains</option></select></div><div className="field"><label>Maximum price: ₹{maxPrice.toLocaleString("en-IN")}</label><input type="range" min="2000" max="50000" step="500" value={maxPrice} onChange={e=>setMaxPrice(Number(e.target.value))}/></div><button className="btn btn-secondary full" onClick={()=>{setQuery("");setCategory("All");setMaxPrice(50000);setSort("featured")}}>Reset filters</button></aside>
      <div className="tour-results"><div className="results-top"><span className="muted">{filtered.length} experiences found</span><select value={sort} onChange={e=>setSort(e.target.value)}><option value="featured">Sort: Featured</option><option value="rating">Top rated</option><option value="price-low">Price: Low to high</option><option value="price-high">Price: High to low</option></select></div>{filtered.length ? <div className="grid two-col">{filtered.map(t=><TourCard key={t.id || t._id} tour={t}/>)}</div> : <div className="empty-state">No tours match your filters.</div>}</div>
    </section>
  </div>;
}