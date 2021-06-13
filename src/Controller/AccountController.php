<?php

namespace App\Controller;

use App\Service\Api;
use Symfony\Bundle\FrameworkBundle\Controller\AbstractController;
use Symfony\Component\HttpFoundation\Request;
use Symfony\Component\HttpFoundation\Response;
use Symfony\Component\Routing\Annotation\Route;

class AccountController extends AbstractController
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
     * @Route("/account", name="account")
     */
    public function index(Request $request): Response
    {
        $token = $request->getSession()->get('token');

        $data = $this->api->userInfo($token);

        return $this->render('account/index.html.twig', [
            'userInfo' => $data['data']
        ]);
    }
}
