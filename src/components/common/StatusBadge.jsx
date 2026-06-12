import { statusBadgeClass } from '../../utils/formatters'

export default function StatusBadge({ status }) {
  return (
    <span className={statusBadgeClass(status)}>
      {status}
    </span>
  )
}