import { forwardRef, useImperativeHandle, useRef } from 'react'
import { FlatList } from 'react-native'

export function createFlashListMock() {
  let lastFlashListRef: {
    prepareForLayoutAnimationRender: jest.Mock
    scrollToOffset: jest.Mock
  } | null = null
  const MockFlatList = FlatList as any
  const FlashList = forwardRef<any, any>((props, ref) => {
    const flatListRef = useRef<any>(null)
    const mockRef = useRef({
      prepareForLayoutAnimationRender: jest.fn(),
      scrollToOffset: jest.fn(
        (params: { animated?: boolean; offset: number }) =>
          flatListRef.current?.scrollToOffset?.(params),
      ),
    })

    lastFlashListRef = mockRef.current

    useImperativeHandle(ref, () => mockRef.current, [])

    return <MockFlatList ref={flatListRef} {...props} />
  })

  FlashList.displayName = 'FlashList'

  return {
    __getLastFlashListRef: () => lastFlashListRef,
    __resetFlashListMock: () => {
      lastFlashListRef = null
    },
    FlashList,
  }
}
