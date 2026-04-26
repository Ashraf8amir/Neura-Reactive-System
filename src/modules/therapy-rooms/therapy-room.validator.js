const Joi = require('joi');
const therapyRoomConstants = require('./therapy-room.constant');

const roomIdPattern = /^[a-zA-Z0-9-]{6,64}$/;
const roomCodePattern = /^[0-9]{6}$/;

const createRoomSchema = Joi.object({
  body: Joi.object({
    title: Joi.string().trim().max(100).required().messages({
      'any.required': 'title is required',
      'string.empty': 'title is required',
      'string.max': 'title cannot exceed 100 characters',
    }),
    maxParticipants: Joi.number()
      .integer()
      .min(therapyRoomConstants.DEFAULTS.MAX_PARTICIPANTS_MIN)
      .max(therapyRoomConstants.DEFAULTS.MAX_PARTICIPANTS_MAX)
      .optional(),
    maxActiveMics: Joi.number()
      .integer()
      .min(1)
      .max(therapyRoomConstants.DEFAULTS.MAX_PARTICIPANTS_MAX)
      .optional(),
  }),
});

const joinByCodeSchema = Joi.object({
  params: Joi.object({
    code: Joi.string().pattern(roomCodePattern).required().messages({
      'any.required': 'code is required',
      'string.pattern.base': 'code must be a 6-digit number',
    }),
  }),
});

const roomIdParamSchema = Joi.object({
  params: Joi.object({
    roomId: Joi.string().pattern(roomIdPattern).required().messages({
      'any.required': 'roomId is required',
      'string.pattern.base': 'roomId is invalid',
    }),
  }),
});

module.exports = {
  createRoomSchema,
  joinByCodeSchema,
  roomIdParamSchema,
};