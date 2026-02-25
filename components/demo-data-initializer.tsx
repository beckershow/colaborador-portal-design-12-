"use client"

import { useEffect } from "react"
import { DemoSeed } from "@/lib/demo-seed"

export function DemoDataInitializer() {
  useEffect(() => {
    DemoSeed.initialize()
  }, [])

  return null
}
