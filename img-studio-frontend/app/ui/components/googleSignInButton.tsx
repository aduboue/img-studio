import icon from 'public/cloudicon.svg'
import Image from 'next/image'
import styles from 'app/ui/components/googleSignInButton.module.css'

export default function GoogleSignInButton(onClick: any) {
  return (
    <button className={styles.button} onClick={onClick()}>
      <div className={styles.buttonstate}></div>
      <div className={styles.buttoncontentwrapper}>
        <div className={styles.buttonicon}>
          <Image priority src={icon} width={23} alt="Google Cloud" />
        </div>
        <span className={styles.buttoncontents}>Sign in with Google</span>
      </div>
    </button>
  )
}
