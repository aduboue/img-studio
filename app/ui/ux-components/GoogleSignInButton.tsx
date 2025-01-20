// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//      https://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

import icon from '../../../public/cloudicon.svg'
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
        <span className={styles.buttoncontents}>Proceed to application</span>
      </div>
    </button>
  )
}
