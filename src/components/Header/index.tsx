import Link from 'next/link';
import styles from './header.module.scss'

export default function Header() {
  // TODO

  return (
    <header className={styles.header}>
      <Link href="/">
        <a>
          <img src="Logo.svg" alt="logo" />
        </a>
      </Link>
    </header>
  );
}
