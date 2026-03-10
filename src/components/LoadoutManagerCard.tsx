interface LoadoutManagerEntry {
  id: string;
  name: string;
  equipped: boolean;
  referenceSlug?: string;
  summary: string;
}

interface LoadoutManagerCardProps {
  armorEntries: LoadoutManagerEntry[];
  shieldEntries: LoadoutManagerEntry[];
  weaponEntries: LoadoutManagerEntry[];
  onSetEquipped: (itemId: string, equipped: boolean) => void;
  onUseUnarmored: () => void;
  onOpenReference: (slug: string) => void;
}

function renderReferenceButton(entry: LoadoutManagerEntry, onOpenReference: (slug: string) => void) {
  if (!entry.referenceSlug) {
    return null;
  }

  return (
    <button
      className="inline-link-button"
      onClick={() => onOpenReference(entry.referenceSlug as string)}
      type="button"
    >
      Ref
    </button>
  );
}

export function LoadoutManagerCard({
  armorEntries,
  shieldEntries,
  weaponEntries,
  onSetEquipped,
  onUseUnarmored,
  onOpenReference,
}: LoadoutManagerCardProps) {
  const equippedArmor = armorEntries.find((entry) => entry.equipped) ?? null;
  const equippedShields = shieldEntries.filter((entry) => entry.equipped);
  const equippedWeapons = weaponEntries.filter((entry) => entry.equipped);

  return (
    <div className="detail-card">
      <div className="detail-card__header">
        <strong>Loadout Manager</strong>
        <span>{equippedWeapons.length} active weapon{equippedWeapons.length === 1 ? "" : "s"}</span>
      </div>
      <p className="muted-copy">
        Change what feeds Armor Class and active weapon rows without leaving the builder.
      </p>

      <div className="stack-md">
        <div className="stack-sm">
          <div className="detail-card__header">
            <strong>Armor</strong>
            <span>{equippedArmor?.name ?? "Unarmored"}</span>
          </div>
          <div className="filter-row">
            <button
              className={`chip ${equippedArmor ? "" : "chip--active"}`}
              onClick={onUseUnarmored}
              type="button"
            >
              Use Unarmored
            </button>
            {armorEntries.map((entry) => (
              <button
                key={entry.id}
                className={`chip ${entry.equipped ? "chip--active" : ""}`}
                onClick={() => onSetEquipped(entry.id, !entry.equipped)}
                type="button"
              >
                {entry.name}
              </button>
            ))}
          </div>
          {equippedArmor ? <p className="muted-copy">{equippedArmor.summary}</p> : <p className="muted-copy">No armor equipped.</p>}
        </div>

        <div className="stack-sm">
          <div className="detail-card__header">
            <strong>Shield</strong>
            <span>{equippedShields.length > 0 ? "Ready" : "Not equipped"}</span>
          </div>
          {shieldEntries.length === 0 ? (
            <p className="muted-copy">No shield is currently tracked in inventory.</p>
          ) : (
            shieldEntries.map((entry) => (
              <div key={entry.id} className="choice-row loadout-manager__entry">
                <div className="stack-sm">
                  <strong>{entry.name}</strong>
                  <p className="muted-copy">{entry.summary}</p>
                </div>
                <div className="library-item__actions">
                  <button
                    className={`chip ${entry.equipped ? "chip--active" : ""}`}
                    onClick={() => onSetEquipped(entry.id, !entry.equipped)}
                    type="button"
                  >
                    {entry.equipped ? "Equipped" : "Equip"}
                  </button>
                  {renderReferenceButton(entry, onOpenReference)}
                </div>
              </div>
            ))
          )}
        </div>

        <div className="stack-sm">
          <div className="detail-card__header">
            <strong>Weapons</strong>
            <span>{equippedWeapons.length > 0 ? `${equippedWeapons.length} equipped` : "No active weapons"}</span>
          </div>
          {weaponEntries.length === 0 ? (
            <p className="muted-copy">No tracked weapons yet.</p>
          ) : (
            weaponEntries.map((entry) => (
              <div key={entry.id} className="choice-row loadout-manager__entry">
                <div className="stack-sm">
                  <strong>{entry.name}</strong>
                  <p className="muted-copy">{entry.summary}</p>
                </div>
                <div className="library-item__actions">
                  <button
                    className={`chip ${entry.equipped ? "chip--active" : ""}`}
                    onClick={() => onSetEquipped(entry.id, !entry.equipped)}
                    type="button"
                  >
                    {entry.equipped ? "Equipped" : "Equip"}
                  </button>
                  {renderReferenceButton(entry, onOpenReference)}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}
