import { getTranslations } from "next-intl/server";
import { SubmitButton } from "@/components/admin/form-controls";
import { db } from "@/lib/db";
import { createPerson, updatePerson, deletePerson } from "@/lib/actions/people";
import { PersonPhotoField } from "@/components/admin/person-photo";

/**
 * Board members and staff — the two lists on /about.
 *
 * Fourteen people exist and all fourteen have photos, but they came from a
 * seed script. Until now there was no way to add a board member after an
 * election, fix a job title or replace a headshot without a developer and a
 * deploy.
 */
export default async function AdminPeoplePage() {
  const people = await db.person.findMany({
    orderBy: [{ kind: "asc" }, { sortOrder: "asc" }],
  });

  const tn = await getTranslations("admin.nav");
  const ta = await getTranslations("admin.common");
  const tp = await getTranslations("admin.people");

  const field =
    "w-full rounded-lg border border-rule bg-paper px-4 py-2.5 text-sm focus:border-accent focus:outline-none";

  const photoLabels = {
    upload: tp("uploadPhoto"),
    replace: tp("replacePhoto"),
    remove: tp("removePhoto"),
    none: tp("noPhoto"),
  };

  const board = people.filter((p) => p.kind === "BOARD_MEMBER");
  const staff = people.filter((p) => p.kind === "STAFF");

  return (
    <div>
      <h1 className="font-display text-2xl font-semibold text-ink">{tn("people")}</h1>
      <p className="mt-2 text-sm text-ink-soft">{tp("intro")}</p>

      <details className="mt-6 rounded-2xl border border-rule bg-surface p-5">
        <summary className="cursor-pointer font-medium text-ink">{tp("newPerson")}</summary>
        <form action={createPerson} className="mt-4 grid gap-3 sm:grid-cols-2">
          <input
            suppressHydrationWarning
            name="name"
            required
            placeholder={tp("namePlaceholder")}
            className={field}
          />
          <select suppressHydrationWarning name="kind" defaultValue="STAFF" className={field}>
            <option value="BOARD_MEMBER">{tp("board")}</option>
            <option value="STAFF">{tp("staff")}</option>
          </select>
          <input
            suppressHydrationWarning
            name="positionEn"
            placeholder={tp("positionEnPlaceholder")}
            className={field}
          />
          <input
            suppressHydrationWarning
            name="positionAr"
            dir="rtl"
            placeholder={tp("positionArPlaceholder")}
            className={field}
          />
          <input
            suppressHydrationWarning
            name="email"
            type="email"
            dir="ltr"
            placeholder={tp("emailPlaceholder")}
            className={field}
          />
          <input
            suppressHydrationWarning
            name="termLabel"
            placeholder={tp("termPlaceholder")}
            className={field}
          />
          <input
            suppressHydrationWarning
            name="sortOrder"
            type="number"
            defaultValue={0}
            placeholder={tp("sortOrderPlaceholder")}
            className={field}
          />
          <div className="sm:col-span-2">
            <SubmitButton>{ta("create")}</SubmitButton>
            <p className="mt-2 text-xs text-ink-faint">{tp("photoAfterCreate")}</p>
          </div>
        </form>
      </details>

      {[
        { heading: tp("board"), rows: board },
        { heading: tp("staff"), rows: staff },
      ].map((group) => (
        <section key={group.heading} className="mt-8">
          <h2 className="ui-caps font-semibold text-ink-faint">{group.heading}</h2>

          <div className="mt-3 space-y-4">
            {group.rows.map((person) => {
              const save = updatePerson.bind(null, person.id);
              const remove = deletePerson.bind(null, person.id);
              return (
                <div key={person.id} className="rounded-2xl border border-rule bg-surface p-5">
                  <PersonPhotoField
                    id={person.id}
                    currentUrl={person.photoUrl}
                    name={person.name}
                    labels={photoLabels}
                  />

                  <details className="mt-4">
                    <summary className="cursor-pointer text-sm text-accent">
                      {person.name}
                      {person.positionEn ? (
                        <span className="ms-2 text-xs text-ink-faint">{person.positionEn}</span>
                      ) : null}
                    </summary>

                    <form action={save} className="mt-3 grid gap-3 sm:grid-cols-2">
                      <input
                        suppressHydrationWarning
                        name="name"
                        required
                        defaultValue={person.name}
                        className={field}
                      />
                      <select
                        suppressHydrationWarning
                        name="kind"
                        defaultValue={person.kind}
                        className={field}
                      >
                        <option value="BOARD_MEMBER">{tp("board")}</option>
                        <option value="STAFF">{tp("staff")}</option>
                      </select>
                      <input
                        suppressHydrationWarning
                        name="positionEn"
                        defaultValue={person.positionEn ?? ""}
                        className={field}
                      />
                      <input
                        suppressHydrationWarning
                        name="positionAr"
                        dir="rtl"
                        defaultValue={person.positionAr ?? ""}
                        className={field}
                      />
                      <input
                        suppressHydrationWarning
                        name="email"
                        type="email"
                        dir="ltr"
                        defaultValue={person.email ?? ""}
                        className={field}
                      />
                      <input
                        suppressHydrationWarning
                        name="termLabel"
                        defaultValue={person.termLabel ?? ""}
                        className={field}
                      />
                      <input
                        suppressHydrationWarning
                        name="sortOrder"
                        type="number"
                        defaultValue={person.sortOrder}
                        className={field}
                      />
                      <div className="sm:col-span-2">
                        <SubmitButton>{ta("save")}</SubmitButton>
                      </div>
                    </form>

                    {/* Its own form so a stray Enter in the edit fields cannot
                        submit a delete. */}
                    <form action={remove} className="mt-3">
                      <SubmitButton variant="ghost">{tp("removePerson")}</SubmitButton>
                    </form>
                  </details>
                </div>
              );
            })}
            {group.rows.length === 0 ? (
              <p className="rounded-2xl border border-rule bg-surface p-5 text-sm text-ink-soft">
                {tp("emptyGroup")}
              </p>
            ) : null}
          </div>
        </section>
      ))}
    </div>
  );
}
