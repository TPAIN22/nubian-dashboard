import AddressesClient from "./AddressesClient";

export const metadata = {
  title: "العناوين | لوحة التحكم",
  description: "عناوين التوصيل المحفوظة مع المواقع على الخريطة",
};

export default function AddressesPage() {
  return <AddressesClient />;
}

// Address data is per-customer and changes constantly — never serve it from a
// static cache.
export const dynamic = "force-dynamic";
