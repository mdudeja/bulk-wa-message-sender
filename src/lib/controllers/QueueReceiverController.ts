import dbConnect from "@/lib/dbConnect"
import { TQueueReceiver } from "@/lib/interfaces/QueueReceivers"
import QueueReceiverModel from "@/lib/models/QueueReceiver.model"

const _init = async (): Promise<boolean> => {
  try {
    const connection = await dbConnect()
    return connection !== null
  } catch (e) {
    console.error(e)
    return false
  }
}

export const addQueueReceiver = async (
  receiver: TQueueReceiver
): Promise<TQueueReceiver | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const newReceiver = new QueueReceiverModel(receiver)

  const saved = await newReceiver.save()

  return saved.toJSON()
}

export const addMultipleQueueReceivers = async (
  receivers: TQueueReceiver[]
): Promise<boolean | null | undefined> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  try {
    const saved = await QueueReceiverModel.insertMany(receivers, {
      throwOnValidationError: false,
      ordered: false,
    })
  } catch (ignore) {
  } finally {
    return true
  }
}

export const fetchReceiversByQueueId = async (
  queueId: string
): Promise<TQueueReceiver[] | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const receivers = await QueueReceiverModel.find({ queueId: queueId })
    .sort({ _id: 1 })
    .exec()

  return receivers.map((receiver) => receiver.toJSON())
}

export const fetchReceiversByQueueIdForFrontend = async (
  queueId: string
): Promise<Array<Partial<TQueueReceiver>> | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const receivers = await QueueReceiverModel.find({
    queueId: queueId,
  })
    .sort({ _id: 1 })
    .exec()

  return receivers.map((receiver) => ({
    name: receiver.name,
    phoneNumber: receiver.phoneNumber,
    processed: receiver.processed,
    delivered: receiver.delivered,
    responses: receiver.responses,
  }))
}

export const fetchPendingReceiversByQueueId = async (
  queueId: string,
  limit: number
): Promise<TQueueReceiver[] | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const receivers = await QueueReceiverModel.find({
    queueId: queueId,
    processed: false,
  })
    .sort({ _id: 1 })
    .limit(limit ?? 50)
    .exec()

  return receivers.map((receiver) => receiver.toJSON())
}

export const updateReceiverById = async (
  receiverId: string,
  updates: Partial<TQueueReceiver>
): Promise<TQueueReceiver | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const receiver = await QueueReceiverModel.findByIdAndUpdate(
    receiverId,
    updates
  )

  return receiver ? receiver.toJSON() : null
}

export const updateReceiverResponsesByPhoneNumber = async (
  queueId: string,
  phoneNumber: string,
  response: string
): Promise<TQueueReceiver | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const receiver = await QueueReceiverModel.findOneAndUpdate(
    { queueId, phoneNumber },
    { $push: { responses: response } }
  )

  return receiver ? receiver.toJSON() : null
}

export const deleteReceiversByQueueName = async (
  queueName: string
): Promise<boolean | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const deleted = await QueueReceiverModel.deleteMany({ queueName })

  return deleted.acknowledged
}

export const fetchRecipientCounts = async (queueId: string) => {
  const receivers = await QueueReceiverModel.countDocuments({ queueId })
  const processed = await QueueReceiverModel.countDocuments({
    queueId,
    processed: true,
  })
  const responsesReceived = await QueueReceiverModel.countDocuments({
    queueId,
    responses: { $ne: [] },
  })

  return {
    total: receivers,
    processed,
    responsesReceived,
  }
}
