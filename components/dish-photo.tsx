import type { MenuItem } from '@/lib/restaurant-data';

export function DishPhoto({ item, className = '' }: { item: MenuItem; className?: string }) {
  if (item.photoUrl) {
    return <div aria-hidden="true" className={`bg-cover bg-center ${className}`} style={{ backgroundImage: `url('${item.photoUrl}')` }} />;
  }

  if (item.id >= 1 && item.id <= 128) {
    const filename = String(item.id).padStart(3, '0');
    return <div aria-hidden="true" className={`bg-cover bg-center ${className}`} style={{ backgroundImage: `url('/menu-images/${filename}.jpg')` }} />;
  }

  const column = item.photo % 5;
  const row = Math.floor(item.photo / 5);
  return <div aria-hidden="true" className={`bg-no-repeat ${className}`} style={{ backgroundImage: "url('/tripti-food-atlas.png')", backgroundPosition: `${column * 25}% ${row * 25}%`, backgroundSize: '500% 500%' }} />;
}
