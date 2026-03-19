import HeroSection from "@/components/home/HeroSection";
import CategoryGrid from "@/components/home/CategoryGrid";
import Products from "@/components/home/Products";
// import TopCollections from "@/components/home/TopCollections";
import CollectionsBanner from "@/components/home/CollectionsBanner";
// import CuratedCollections from "@/components/home/CuratedCollections";
import InstagramSection from "@/components/home/InstagramSection";

export default function HomePage() {
  return (
    <main>
      <HeroSection />
      {/* <Categories />
      <PriceSegments />
      <FabricCollections />
      <WhatsAppCTA /> */}
      <CategoryGrid />
      <Products />
      {/* <TopCollections /> */}
      <CollectionsBanner />
      {/* <CuratedCollections /> */}
      <InstagramSection />
    </main>
  );
}
