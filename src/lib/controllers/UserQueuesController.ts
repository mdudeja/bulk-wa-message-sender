import dbConnect from "@/lib/dbConnect"
import { TUserQueue } from "@/lib/interfaces/UserQueues"
import UserQueuesModel from "@/lib/models/UserQueues.model"

const _init = async (): Promise<boolean> => {
  try {
    const connection = await dbConnect()
    return connection !== null
  } catch (e) {
    console.error(e)
    return false
  }
}

export const fetchQueuesByUser = async (
  username: string
): Promise<TUserQueue[] | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const queues = await UserQueuesModel.find({ username: username }).exec()

  return queues.map((queue) => ({
    ...queue.toJSON(),
    _id: queue._id.toString(),
  }))
}

export const fetchQueueByUserAndName = async (
  username: string,
  queueName: string
): Promise<TUserQueue | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const queue = await UserQueuesModel.findOne({
    username: username,
    queueName: queueName,
  }).exec()

  return queue ? queue.toJSON() : null
}

export const fetchQueueById = async (
  queueId: string
): Promise<TUserQueue | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const queue = await UserQueuesModel.findById(queueId).exec()

  return queue ? queue.toJSON() : null
}

export const updateQueueById = async (
  queueId: string,
  update: Partial<TUserQueue>
): Promise<TUserQueue | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const updated = await UserQueuesModel.findByIdAndUpdate(
    queueId,
    update
  ).exec()

  return updated ? updated.toJSON() : null
}

export const addUserQueue = async (
  queue: TUserQueue
): Promise<TUserQueue | null> => {
  const connection = await _init()

  if (!connection) {
    return null
  }

  const newQueue = new UserQueuesModel(queue)

  const saved = await newQueue.save()

  return saved.toJSON()
}

export const deleteUserQueue = async (
  queueName: string,
  username: string
): Promise<boolean> => {
  const connection = await _init()

  if (!connection) {
    return false
  }

  const deleted = await UserQueuesModel.deleteOne({
    username: username,
    queueName: queueName,
  }).exec()

  return deleted.deletedCount === 1
}
