import icon from 'public/cloudicon.svg'
import Image from 'next/image'
import styles from './GoogleSignInButton.module.css'

export default function GoogleSignInButton({ onClick }: { onClick: () => void }) {
  return (
    <button className={styles.button} onClick={onClick}>
      <div className={styles.buttonstate}></div>
      <div className={styles.buttoncontentwrapper}>
        <div className={styles.buttonicon}>
          <Image priority src={icon} width={23} alt="Google Cloud" />
        </div>
        <span className={styles.buttoncontents}>You're signed in with Google</span>
      </div>
    </button>
  )
}
