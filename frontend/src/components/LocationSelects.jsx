import { Select, TextInput } from './ui/Form.jsx';
import { useMeta } from '../context/MetaContext.jsx';

/**
 * Campus -> Building -> Room: three linked dropdowns.
 * Choosing a campus clears building + room; choosing a building clears the room.
 * value = { campus_id, building_id, room_id }   onChange(patch) merges into your form state.
 * Set `showRoom={false}` for filters that only need campus + building.
 */
export default function LocationSelects({ value, onChange, errors = {}, showRoom = true, required = true, layout = 'grid', excludeCampusNames = [], allowCustomBuilding = false, roomAsInput = false }) {
  const { meta } = useMeta();
  const campuses = meta.campuses.filter((campus) => !excludeCampusNames.includes(campus.name));
  const buildings = meta.buildings.filter((b) => String(b.campus_id) === String(value.campus_id));
  const wrap = layout === 'grid' ? 'grid gap-4 sm:grid-cols-2' : 'space-y-4';
  const isCustomBuilding = value.building_id === 'other';

  return (
    <div className={wrap}>
      <Select label="Campus" required={required} value={value.campus_id} error={errors.campus_id} placeholder="Select campus"
        options={campuses.map((c) => ({ value: c.id, label: c.name }))}
        onChange={(e) => onChange({ campus_id: e.target.value, building_id: '', room_id: '' })} />
      <Select label="Building" required={required} value={value.building_id} error={errors.building_id}
        placeholder={value.campus_id ? 'Select building' : 'Choose a campus first'} disabled={!value.campus_id}
        options={[
          ...buildings.map((b) => ({ value: b.id, label: b.name })),
          ...(allowCustomBuilding ? [{ value: 'other', label: 'Others' }] : []),
        ]}
        onChange={(e) => onChange({ building_id: e.target.value, building_name: '', room_id: '', room_name: '' })} />
      {allowCustomBuilding && isCustomBuilding && (
        <TextInput label="Specific building" required={required} placeholder="Enter the building name"
          value={value.building_name} error={errors.building_name}
          onChange={(e) => onChange({ building_name: e.target.value })} />
      )}
      {showRoom && (
        roomAsInput ? (
          <TextInput label="Specific room / location" required={required} value={value.room_name} error={errors.room_name}
            placeholder={value.building_id ? 'Enter the room or location' : 'Choose a building first'} disabled={!value.building_id}
            onChange={(e) => onChange({ room_name: e.target.value })} className={layout === 'grid' ? 'sm:col-span-2' : ''} />
        ) : (
          <Select label="Specific room / location" required={required} value={value.room_id} error={errors.room_id}
            placeholder={value.building_id ? 'Select room' : 'Choose a building first'} disabled={!value.building_id}
            options={meta.rooms.filter((r) => String(r.building_id) === String(value.building_id)).map((r) => ({ value: r.id, label: r.name }))}
            onChange={(e) => onChange({ room_id: e.target.value })} className={layout === 'grid' ? 'sm:col-span-2' : ''} />
        )
      )}
    </div>
  );
}
