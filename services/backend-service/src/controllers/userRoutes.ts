import { Request, Response } from 'express';

// Temporary stub endpoints to satisfy frontend calls until real user persistence exists.
export const userFavouriteRoutesHandler = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: []
  });
};

export const userMostCommonRouteHandler = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      route_id: '6',
      origin_stop: 'Sample Origin',
      destination_stop: 'Sample Destination'
    }
  });
};

export const userLastRouteHandler = (_req: Request, res: Response) => {
  res.json({
    success: true,
    data: {
      route_id: '6',
      origin_stop: 'Sample Origin',
      destination_stop: 'Sample Destination'
    }
  });
};

export const addFavouriteRouteHandler = (req: Request, res: Response) => {
  const { route_id } = req.body ?? {};
  if (!route_id) return res.status(400).json({ success: false, error: 'route_id is required' });
  res.json({ success: true, data: { route_id } });
};
