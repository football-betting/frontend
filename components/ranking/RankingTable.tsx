import Link from "next/link";
import type { RatingUser } from "@/lib/rating";
import { abbreviateUsername } from "@/lib/format";

interface RankingTableProps {
  users: RatingUser[];
  currentUserId: number;
  emptyMessage?: string;
}

const COLUMNS: {
  key: "sum_win_exact" | "sum_score_diff" | "sum_team" | "extra_point";
  full: string;
  short: string;
}[] = [
  { key: "sum_win_exact", full: "EXACT", short: "RE" },
  { key: "sum_score_diff", full: "DIFF", short: "T" },
  { key: "sum_team", full: "WINS", short: "S" },
  { key: "extra_point", full: "BONUS", short: "EP" },
];

function formatPosition(position: number): string {
  return position < 10 ? `0${position}` : String(position);
}

export function RankingTable({
  users,
  currentUserId,
  emptyMessage = "No users in this department yet",
}: RankingTableProps): React.ReactElement {
  if (users.length === 0) {
    return (
      <div className="bg-surface-container-low border border-outline-variant rounded-xl p-xl text-center text-body-sm text-on-surface-variant">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className="bg-surface-container-low border border-outline-variant rounded-xl overflow-hidden shadow-2xl">
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-surface-container-highest border-b border-outline-variant">
              <th className="px-md py-lg text-label-caps uppercase text-on-surface-variant">
                POS
              </th>
              <th className="px-md py-lg text-label-caps uppercase text-on-surface-variant">
                USERNAME
              </th>
              {COLUMNS.map((col) => (
                <th
                  key={col.key}
                  className="px-md py-lg text-label-caps uppercase text-on-surface-variant text-center"
                >
                  {col.full}
                </th>
              ))}
              <th className="px-md py-lg text-label-caps uppercase text-primary text-center">
                TOTAL
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-outline-variant/30">
            {users.map((u) => {
              const isCurrent = u.user_id === currentUserId;
              return (
                <tr
                  key={u.user_id}
                  className={
                    isCurrent
                      ? "bg-primary/10 border-l-4 border-primary"
                      : "hover:bg-surface-container-highest transition-colors"
                  }
                >
                  <td
                    className={`px-md py-md font-mono text-data-mono ${
                      isCurrent ? "text-primary font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {formatPosition(u.position)}
                  </td>
                  <td className="px-md py-md text-headline-md">
                    <Link
                      href={`/user/${u.user_id}`}
                      className={`hover:underline ${
                        isCurrent ? "text-primary font-bold" : ""
                      }`}
                    >
                      {abbreviateUsername(u.name)}
                    </Link>
                    {isCurrent ? (
                      <span className="ml-sm bg-primary text-on-primary text-[10px] font-bold px-1 rounded uppercase tracking-tighter">
                        YOU
                      </span>
                    ) : null}
                  </td>
                  {COLUMNS.map((col) => (
                    <td
                      key={col.key}
                      className={`px-md py-md font-mono text-data-mono text-center ${
                        isCurrent ? "text-primary" : ""
                      }`}
                    >
                      {u[col.key]}
                    </td>
                  ))}
                  <td
                    className={`px-md py-md font-mono text-headline-md text-center ${
                      isCurrent ? "text-primary font-bold" : ""
                    }`}
                  >
                    {u.score_sum}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <ul className="md:hidden divide-y divide-outline-variant/30">
        {users.map((u) => {
          const isCurrent = u.user_id === currentUserId;
          return (
            <li
              key={u.user_id}
              className={
                isCurrent
                  ? "bg-primary/10 border-l-4 border-primary p-md"
                  : "p-md"
              }
            >
              <div className="flex items-center justify-between gap-md mb-sm">
                <div className="flex items-center gap-md min-w-0">
                  <span
                    className={`font-mono text-data-mono shrink-0 ${
                      isCurrent ? "text-primary font-bold" : "text-on-surface-variant"
                    }`}
                  >
                    {formatPosition(u.position)}
                  </span>
                  <Link
                    href={`/user/${u.user_id}`}
                    className={`text-headline-md truncate hover:underline ${
                      isCurrent ? "text-primary font-bold" : ""
                    }`}
                  >
                    {abbreviateUsername(u.name)}
                  </Link>
                  {isCurrent ? (
                    <span className="bg-primary text-on-primary text-[10px] font-bold px-1 rounded uppercase tracking-tighter shrink-0">
                      YOU
                    </span>
                  ) : null}
                </div>
                <span
                  className={`font-mono text-headline-md shrink-0 ${
                    isCurrent ? "text-primary font-bold" : ""
                  }`}
                >
                  {u.score_sum}
                  <span className="text-label-caps uppercase text-on-surface-variant ml-1">
                    P
                  </span>
                </span>
              </div>
              <dl className="grid grid-cols-4 gap-sm">
                {COLUMNS.map((col) => (
                  <div
                    key={col.key}
                    className="flex flex-col items-center bg-surface-container rounded p-xs"
                  >
                    <dt className="text-label-caps uppercase text-on-surface-variant">
                      {col.short}
                    </dt>
                    <dd
                      className={`font-mono text-data-mono ${
                        isCurrent ? "text-primary" : ""
                      }`}
                    >
                      {u[col.key]}
                    </dd>
                  </div>
                ))}
              </dl>
            </li>
          );
        })}
      </ul>
      <div className="px-md py-md border-t border-outline-variant bg-surface-container text-label-caps uppercase text-on-surface-variant">
        {users.length} {users.length === 1 ? "user" : "users"}
      </div>
    </div>
  );
}
