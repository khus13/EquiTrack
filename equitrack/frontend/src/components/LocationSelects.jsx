import { useId } from 'react';
import { Select, TextInput } from './ui/Form.jsx';
import { useMeta } from '../context/MetaContext.jsx';

/**
 * Campus -> Building -> Room: choose a campus, then enter or select location names.
 * Choosing a campus clears building + room.
 * value = { campus_id, building_name, room_name }   onChange(patch) merges into your form state.
 * Set `showRoom={false}` for filters that only need campus + building.
 */
export default function LocationSelects({ value, onChange, errors = {}, showRoom = true, required = true, layout = 'grid' }) {
  const { meta } = useMeta();
  const buildings = meta.buildings.filter((b) => String(b.campus_id) === String(value.campus_id));
  const selectedBuilding = buildings.find((building) => building.name.trim().toLowerCase() === (value.building_name || '').trim().toLowerCase());
  const rooms = selectedBuilding ? meta.rooms.filter((room) => String(room.building_id) === String(selectedBuilding.id)) : [];
  const wrap = layout === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4';
  const buildingListId = useId();
  const roomListId = useId();

  return (
    <div className={wrap}>
      <Select label="Campus" required={required} value={value.campus_id} error={errors.campus_id} placeholder="Select campus"
        options={meta.campuses.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(e) => onChange({ campus_id: e.target.value, building_name: '', room_name: '' })} />
      <div>
        <TextInput label="Building" required={required} value={value.building_name || ''} error={errors.building_name || errors.building_id}
          hint="Choose a suggestion or enter a new building name for this campus."
          maxLength={120} placeholder={value.campus_id ? 'Enter or choose a building' : 'Choose a campus first'} disabled={!value.campus_id}
          list={buildingListId} onChange={(e) => onChange({ building_name: e.target.value })} />
        <datalist id={buildingListId}>
          {buildings.map((building) => <option key={building.id} value={building.name} />)}
        </datalist>
      </div>
      {showRoom && (
        <div className={layout === 'grid' ? 'sm:col-span-2' : ''}>
          <TextInput label="Specific room / location" required={required} value={value.room_name || ''} error={errors.room_name || errors.room_id}
            hint="Choose a suggestion or enter a new room name for this building."
            maxLength={120} placeholder={value.building_name?.trim() ? 'Enter or choose a room' : 'Enter a building first'} disabled={!value.building_name?.trim()}
            list={roomListId} onChange={(e) => onChange({ room_name: e.target.value })} />
          <datalist id={roomListId}>
            {rooms.map((room) => <option key={room.id} value={room.name} />)}
          </datalist>
        </div>
      )}
    </div>
  );
}
