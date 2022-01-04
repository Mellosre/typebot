import {
  Editable,
  EditableInput,
  EditablePreview,
  Stack,
  useEventListener,
} from '@chakra-ui/react'
import React, { useEffect, useMemo, useState } from 'react'
import { Block } from 'bot-engine'
import { useGraph } from 'contexts/GraphContext'
import { useDnd } from 'contexts/DndContext'
import { StepsList } from './StepsList'
import { isDefined } from 'utils'
import { useTypebot } from 'contexts/TypebotContext'
import { ContextMenu } from 'components/shared/ContextMenu'
import { BlockNodeContextMenu } from './BlockNodeContextMenu'

type Props = {
  block: Block
}

export const BlockNode = ({ block }: Props) => {
  const { connectingIds, setConnectingIds, previewingIds } = useGraph()
  const { updateBlockPosition, addStepToBlock } = useTypebot()
  const { draggedStep, draggedStepType, setDraggedStepType, setDraggedStep } =
    useDnd()
  const [isMouseDown, setIsMouseDown] = useState(false)
  const [titleValue, setTitleValue] = useState(block.title)
  const [showSortPlaceholders, setShowSortPlaceholders] = useState(false)
  const [isConnecting, setIsConnecting] = useState(false)
  const isPreviewing = useMemo(
    () =>
      previewingIds.sourceId === block.id ||
      previewingIds.targetId === block.id,
    [block.id, previewingIds.sourceId, previewingIds.targetId]
  )

  useEffect(() => {
    setIsConnecting(
      connectingIds?.target?.blockId === block.id &&
        !isDefined(connectingIds.target?.stepId)
    )
  }, [block.id, connectingIds])

  const handleTitleChange = (title: string) => setTitleValue(title)

  const handleMouseDown = () => {
    setIsMouseDown(true)
  }
  const handleMouseUp = () => {
    setIsMouseDown(false)
  }

  const handleMouseMove = (event: MouseEvent) => {
    if (!isMouseDown) return
    const { movementX, movementY } = event

    updateBlockPosition(block.id, {
      x: block.graphCoordinates.x + movementX,
      y: block.graphCoordinates.y + movementY,
    })
  }

  useEventListener('mousemove', handleMouseMove)

  const handleMouseEnter = () => {
    if (draggedStepType || draggedStep) setShowSortPlaceholders(true)
    if (connectingIds)
      setConnectingIds({ ...connectingIds, target: { blockId: block.id } })
  }

  const handleMouseLeave = () => {
    setShowSortPlaceholders(false)
    if (connectingIds) setConnectingIds({ ...connectingIds, target: undefined })
  }

  const handleStepDrop = (index: number) => {
    setShowSortPlaceholders(false)
    if (draggedStepType) {
      addStepToBlock(block.id, draggedStepType, index)
      setDraggedStepType(undefined)
    }
    if (draggedStep) {
      addStepToBlock(block.id, draggedStep, index)
      setDraggedStep(undefined)
    }
  }

  return (
    <ContextMenu<HTMLDivElement>
      renderMenu={() => <BlockNodeContextMenu blockId={block.id} />}
    >
      {(ref, isOpened) => (
        <Stack
          ref={ref}
          p="4"
          rounded="lg"
          bgColor="blue.50"
          borderWidth="2px"
          borderColor={
            isConnecting || isOpened || isPreviewing ? 'blue.400' : 'gray.400'
          }
          minW="300px"
          transition="border 300ms"
          pos="absolute"
          style={{
            transform: `translate(${block.graphCoordinates.x}px, ${block.graphCoordinates.y}px)`,
          }}
          onMouseDown={handleMouseDown}
          onMouseUp={handleMouseUp}
          onMouseEnter={handleMouseEnter}
          onMouseLeave={handleMouseLeave}
        >
          <Editable value={titleValue} onChange={handleTitleChange}>
            <EditablePreview
              _hover={{ bgColor: 'blue.100' }}
              px="1"
              userSelect={'none'}
            />
            <EditableInput minW="0" px="1" />
          </Editable>
          <StepsList
            blockId={block.id}
            steps={block.steps}
            showSortPlaceholders={showSortPlaceholders}
            onMouseUp={handleStepDrop}
          />
        </Stack>
      )}
    </ContextMenu>
  )
}