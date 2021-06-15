<?php

namespace App\Controller;

use App\Service\Api;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class DashboardController extends AbstractController
{
    private Api $api;

    /**
     * @param \App\Service\Api $api
     */
    public function __construct(Api $api)
    {
        $this->api = $api;
    }

    /**
     * @Route("/home", name="home")
     */
    public function home(Request $request): Response
    {
        $token = $request->getSession()->get('token');

        $data = $this->api->user($token);

        if(!isset($data['data']) || !isset($data['data']['tips'])) {
            return $this->redirectToRoute('app_logout');
        }

        $games = $data['data']['tips'];

        $table = $this->api->table($token);
        $users = $table['data']['users'];
      
        return $this->render('home/index.html.twig' ,[
            'games' => $games,
            'users' => $users,
        ]);
    }


    /**
     * @Route("/table", name="table")
     */
    public function table(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $data = $this->api->table($token);

        if(!isset($data['data']) || !isset($data['data']['users'])) {
            return $this->redirectToRoute('app_logout');
        }

        return $this->render('home/table.html.twig' ,[
            'users' => $data['data']['users'],
        ]);
    }

    /**
     * @Route("/test", name="test")
     */
    public function test(Request $request): Response
    {
        $token = $request->getSession()->get('token');
        $conetnt = json_decode($request->getContent(), true);

        $conetnt['tipTeam1'] = (int)$conetnt['tipTeam1'];
        $conetnt['tipTeam2'] = (int)$conetnt['tipTeam2'];

        $data = $this->api->tips($token, $conetnt);
        $json = json_encode($data);

        return new Response($json);
    }
}
