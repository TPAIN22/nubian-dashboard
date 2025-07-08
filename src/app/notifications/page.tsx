import React from 'react'
import {NotificationForm} from '@/components/NotificationForm'
import Side from '@/components/ui/side-bar-provider'

function page() {
  return (
      <div className='flex flex-col gap-4 h-full'>
        <NotificationForm/>   
      </div>
  )
}

export default page