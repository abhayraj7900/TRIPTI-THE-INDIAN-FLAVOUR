import type { MenuItem } from '@/lib/restaurant-data';

const sheetWidth = 1536;
const sheetHeight = 1024;

const columns = [
  [0, 104], [110, 98], [213, 98], [317, 98], [419, 96],
  [519, 97], [621, 96], [722, 93], [819, 99], [922, 95],
  [1021, 96], [1121, 98], [1224, 99], [1328, 100], [1433, 103],
] as const;

const rows = [
  [0, 89], [109, 88], [218, 89], [328, 84], [432, 83],
  [535, 72], [626, 87], [732, 71], [821, 70], [910, 93],
] as const;

// Some printed numbers in the supplied board are duplicated or missing, so
// slots are matched by the food shown instead of trusting those labels.
const menuPhotoSlots = [
  0, 1, 2, 3, 6, 7, 9, 10, 12, 14,
  15, 16, 17, 18, 19, 20, 22, 29,
  30, 31, 32, 33, 34, 35, 43, 44,
  45, 46, 47, 48, 49, 51, 50, 52, 53, 48, 54, 55, 56, 57, 60, 61, 62, 63, 64, 65, 68,
  75, 76, 77, 77, 79, 79, 89, 74, 80, 81, 82, 83, 84, 84, 80, 82, 85, 86, 87, 88, 85, 78, 78, 89,
  90, 90, 91, 103, 90, 97, 92, 93, 94, 95, 96, 101, 102, 97, 100, 98, 99, 104, 100, 101, 102, 104, 103, 104, 103,
  105, 106, 108, 109, 110, 111, 116, 113, 107, 118,
  120, 121, 122, 122, 123, 124, 125, 126, 127, 128, 129, 130, 131, 132, 133, 134,
  135, 136, 137, 138, 139, 140,
] as const;

function suppliedPhotoCrop(itemId: number) {
  const slot = menuPhotoSlots[itemId - 1];
  if (slot === undefined) return null;
  const column = columns[slot % columns.length];
  const row = rows[Math.floor(slot / columns.length)];
  if (!column || !row) return null;
  return { x: column[0], y: row[0], width: column[1], height: row[1] };
}

export function DishPhoto({ item, className = '' }: { item: MenuItem; className?: string }) {
  if (item.photoUrl) {
    return <div aria-hidden="true" className={`bg-cover bg-center ${className}`} style={{ backgroundImage: `url('${item.photoUrl}')` }} />;
  }

  const crop = suppliedPhotoCrop(item.id);
  if (crop) {
    return (
      <svg aria-hidden="true" className={className} preserveAspectRatio="xMidYMid slice" viewBox={`${crop.x} ${crop.y} ${crop.width} ${crop.height}`}>
        <image href="/tripti-menu-photo-board.png" width={sheetWidth} height={sheetHeight} />
      </svg>
    );
  }

  const column = item.photo % 5;
  const row = Math.floor(item.photo / 5);
  return <div aria-hidden="true" className={`bg-no-repeat ${className}`} style={{ backgroundImage: "url('/tripti-food-atlas.png')", backgroundPosition: `${column * 25}% ${row * 25}%`, backgroundSize: '500% 500%' }} />;
}
